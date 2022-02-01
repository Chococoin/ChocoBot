// 'use strict'

const { Telegraf, Markup } = require('telegraf')
const fs = require('fs')

const mongoose = require('mongoose')
const User = require('./Schemas/User.js')

db()
 .then( () => console.log("Mongo database connected") )
 .catch( err => console.log(`Mongo database not connected ${err}`) )

async function db() {
    await mongoose.connect('mongodb://127.0.0.1:27017/chocobot')
}

async function newUser(data) {
    console.log("Data", data);
    let username = data.from.username
    let name = data.from.first_name
    let language_code = data.from.language_code
    let telegramID = data.from.id
    let sinceMessageID = data.message_id
    let referer = 0
    const user = new User({ username, name, language_code, telegramID, referer, sinceMessageID })
    user.save()
}

async function newSession(data) {
    let partner = await User.findOne({username: data.username})
    partner.session++
    partner.save()
    console.log(`${partner.username} has interacted with the bot ${partner.session} times`)
}

const telegramApiKey = fs.readFileSync(".telegramApiKey").toString().trim()
const PAYMENT_TOKEN = fs.readFileSync(".stripeApiKey").toString().trim()

const app = new Telegraf(telegramApiKey)

const products = [
    {
        name: 'Adopzione Albero di Cacao di Massimo Pincay',
        price: 30.00,
        description: 'Il cuore del progetto ChocoCryto parte dal fatto che doviamo avere cura di chi ci porta da mangiare. Adotta un albero di cacao per ricevere a vita il migliore cioccolato dal mondo con un sconto del 50%',
        photoUrl: 'https://i.ibb.co/hB7VmDW/2021-07-13-12-43-13.jpg'
    }
]

function createInvoice (product) {
    return {
        provider_token: PAYMENT_TOKEN,
        start_parameter: 'foo',
        title: product.name,
        description: product.description,
        currency: 'EUR',
        photo_url: product.photoUrl,
        is_flexible: false,
        need_shipping_address: false,
        prices: [{ label: product.name, amount: Math.trunc(product.price * 100) }],
        payload: {}
    }
}

async function dbCount(ctx) {
    let data = ctx.update.message
    let visitor = await User.findOne({ telegramID: data.from.id})
    console.log("Visitor", visitor)
    if(visitor.length === 0) {
        newUser(ctx.update.message)
    } else {
        newSession(visitor)
    }
}

// Start command
app.command('start', ( ctx ) => {
    ctx.reply('Bevenuto! Io sono 🤖 robot della Chocosfera🍫. Cerco ciocconauti 👨🏼‍🚀 disposti a imbarcarsi 🚀 in una avventura divina 😋. Se ti interesano i dettagli clicca su \/continua.')
    dbCount(ctx)
})

app.command('continua', ( ctx ) => {
    ctx.reply('La Chocosfera è la dimensione dove possiamo divertirci dando il meglio di noi! In questo momento siamo nella fase del adopzioni dei alberi 🌳 se vuoi partecipare a compiere questa missione lo poi fare acquistando uno dei nostri \/prodotti')
    dbCount(ctx)
})
app.command('aiuto', ( ctx ) => {
    ctx.reply('Ricomincia con \/start, darò il mio meglio per guidarti.')
    dbCount(ctx)
})

app.command('adopzioni', ( ctx ) => {
    ctx.reply('Ora ci sono 4 alberi adoptati dal signore Carlo Antonello. Grazie Carlo!')
})

app.command('prodotti', ( ctx ) => {
    ctx.replyWithMarkdown(
        `Essere un ciocconauta è essere un early adopter. Una cosa meravigliosa secondo me.\nNon perdere l\'opportunità di essere un pioniere nella Chocosfera 🤖❤️🌳🍫.
        ${products.reduce((acc, p) => { return (acc += `*${p.name}* - ${p.price} €\n     `)
        },'')}`, Markup.keyboard(products.map(p => p.name)).oneTime().resize())
    dbCount(ctx)
})

// Order product
products.forEach(p => {
    app.hears(p.name, (ctx) => {
        console.log(`${ctx.from.first_name} sta ordinando un/a ${p.name}.`)
        ctx.replyWithInvoice(createInvoice(p))
    })
})

// Handle payment callbacks
app.on('pre_checkout_query', ( ctx ) => ctx.answerPreCheckoutQuery(true))
app.on('successful_payment', ( ctx ) => {
    console.log(`${ctx.from.first_name} (${ctx.from.username}) ha pagato ${ctx.message.successful_payment.total_amount / 100} €.`)
})

// app.command('venue', (ctx) => {
//     console.log("Location", ctx.message)
// })

app.startPolling()
