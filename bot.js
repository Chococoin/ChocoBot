// 'use strict'

const { Telegraf } = require('telegraf')
const fs = require('fs')
const { Markup } = Telegraf

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
    console.log(`${partner.username} has visited the bot ${partner.session} times`)
}

const telegramApiKey = fs.readFileSync(".telegramApiKey").toString().trim()
const PAYMENT_TOKEN = fs.readFileSync(".stripeApiKey").toString().trim()

const app = new Telegraf(telegramApiKey)

const products = [
    {
        name: 'Chococoin Brown Paper',
        price: 1.00,
        description: 'Il libro che spiega come il chococoin e la chocosfera servirano per migliorare il mondo partendo dalla trasparenza dentro la filiera del cioccolato',
        photoUrl: 'https://i.ibb.co/fvH96HL/Cacao-In-Progress.png'
    },
    {
        name: 'Combo ChocoCrypto',
        price: 15.00,
        description: 'Collabora con il progetto aquistando in prevendita le tre tavolette ChocoCrypto',
        photoUrl: 'https://i.ibb.co/0fWf8YL/Mockup-Choco-Crypto.jpg'
    },
    {
        name: 'Singola Tavoletta ChocoCrypto',
        price: 5.00,
        description: 'Collabora con il progetto aquistando in prevendita una tavoletta ChocoCrypto. Scegli uno dei tre sapori "White", "Milk" o "Dark"',
        photoUrl: 'https://i.ibb.co/0fWf8YL/Mockup-Choco-Crypto.jpg'
    },
    {
        name: 'Adopzione Albero di Cacao di Massimo Pincay',
        price: 25.00,
        description: 'Il cuore del progetto ChocoCryto parte dal fatto che doviamo avere cura di chi ci porta da mangiare. Adotta un albero di cacao per ricevere a vita il migliore cioccolato dal mondo con un sconto del 50%',
        photoUrl: 'https://i.ibb.co/hB7VmDW/2021-07-13-12-43-13.jpg'
    },
    {
        name: 'Cartolina Chocosfera',
        price: 2.00,
        description: 'Sei diventato un early adopter del nostro progetto e vorresti un souvenir del prossimo unicorno italiano in fase embrionaria? Magari una cartolina di collezione spedita direttamente dalla Chocosfera fa per te.',
        photoUrl: 'https://i.ibb.co/NNwCGJt/cartolina.jpg'
    },
    {
        name: 'Computer Choco Harvester',
        price: 90.00,
        description: 'Il computer più avanzato per "minare" cripto moneta, usa un albero di cacao invece di elettricità. Educhiamo i nostri ragazzi a trovare soluzioni creative ai problemi del mondo..',
        photoUrl: 'https://i.ibb.co/qg5T8kH/Screenshot-2021-07-11-at-18-52-24.jpg'
    },
    {
        name: 'Cryptocita',
        price: 8.00,
        description: 'Crema di nocciole di filliera tracciata con la blockchain. Con le migliore nocciole del piemonte.',
        photoUrl: 'https://i.ibb.co/vm22R4p/cryptocita-copy.jpg'
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

app.use(async (ctx) => {
    let data = ctx.update.message
    let visitor = await User.findOne({ telegramID: data.from.id})
    console.log("Visitor", visitor)
    if(visitor.length === 0) {
        newUser(ctx.update.message)
    } else {
        newSession(visitor)
    }
})

// Start command
app.command('start', ({ reply }) => {
    reply('Bevenuto! Io sono 🤖 robot della Chocosfera🍫. Cerco ciocconauti 👨🏼‍🚀 disposti a imbarcarsi 🚀 in una avventura divina 😋. Se ti interesano i dettagli clicca su \/continua.')
})

app.command('continua', ({ reply }) => reply('La Chocosfera è la dimensione dove possiamo divertirci dando il meglio di noi! In questo momento siamo nella fase del crowdfunding se vuoi partecipare a compiere questa missione lo poi fare acquistando uno dei nostri \/prodotti'))
app.command('aiuto', ({ reply }) => reply('Ricomincia con \/start, darò il mio meglio per guidarti.'))
app.command('prodotti', ({ replyWithMarkdown }) => replyWithMarkdown(
    `Essere un ciocconauta è essere un early adopter. Una cosa meravigliosa secondo me.\nNon perdere l\'opportunità di essere un pioniere nella Chocosfera 🤖❤️🌳🍫.
     ${products.reduce((acc, p) => { return (acc += `*${p.name}* - ${p.price} €\n     `)
     },'')}`, Markup.keyboard(products.map(p => p.name)).oneTime().resize().extra()
))

// Order product
products.forEach(p => {
    app.hears(p.name, (ctx) => {
        console.log(`${ctx.from.first_name} sta ordinando un/a ${p.name}.`)
        ctx.replyWithInvoice(createInvoice(p))
    })
})

// Handle payment callbacks
app.on('pre_checkout_query', ({ answerPreCheckoutQuery }) => answerPreCheckoutQuery(true))
app.on('successful_payment', (ctx) => {
    console.log(`${ctx.from.first_name} (${ctx.from.username}) ha pagato ${ctx.message.successful_payment.total_amount / 100} €.`)
})

// app.command('venue', (ctx) => {
//     console.log("Location", ctx.message)
// })

app.startPolling()
