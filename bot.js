'use strict'

const { Telegraf, Markup } = require('telegraf')
const fs = require('fs')
require('dotenv').config()

const mongoose = require('mongoose')
const User = require('./Schemas/User.js')

db()
 .then( () => console.log("Mongo database connected") )
 .catch( err => console.log(`Mongo database not connected ${err}`) )

async function db() {
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/chocobot')
}

async function newUser(ctx) {
    let { invite_link : link } = await createLink(ctx)
    let data = ctx.update.message
    let username = data.from.username
    let name = data.from.first_name
    let language_code = data.from.language_code
    let telegramID = data.from.id
    let sinceMessageID = data.message_id
    let referer = 0
    const user = new User({ username, name, language_code, telegramID, referer, sinceMessageID, link })
    user.save()
    console.log(`${username} is a new user with referer link ${link}.`)
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
        name: 'Adopción Árbol de Cacao PM12',
        price: 30.00,
        description: 'El corazón del proyecto Bit&Nibs parte del hecho de que tenemos que cuidar a quienes nos aydan a colocar el alimento en nuestros hogares.\nAdopta un árbol de cacao para recibir el mejor chocolate del mundo de por vida con un 50% de descuento',
        photoUrl: 'https://i.ibb.co/hB7VmDW/2021-07-13-12-43-13.jpg'
    }
]

function createInvoice (product) {
    return {
        provider_token: PAYMENT_TOKEN,
        start_parameter: null,
        title: product.name,
        description: product.description,
        currency: 'EUR',
        photo_url: product.photoUrl,
        is_flexible: false,
        need_shipping_address: false,
        need_email: true,
        prices: [{ label: product.name, amount: Math.trunc(product.price * 100) }],
        payload: {},
        max_tip_amount: 550,
        suggested_tip_amounts: [200, 250, 300]
    }
}

async function dbCount(ctx) {
    let data = ctx.update.message
    let visitor = await User.findOne({ telegramID: data.from.id})
    if(visitor) {
        newSession(visitor)
    } else {
        newUser(ctx)
    }
}

async function createLink(ctx){
    let link = await ctx.createChatInviteLink({ expire_date: 1800000000, creates_join_request: true, name: ctx.update.message.from.username });
    console.log("From createlink:", link)
    return link
}

// Start command
app.start(( ctx ) => {
    ctx.reply('¡Bienvenid@! Soy el 🤖 bot del circulo de amig@s de los árboles de cacao del Maestro Máximo Pincay.\n\n' +
               'Mi trabajo es mostrar con transparencia los árboles de cacao adoptados por choconautas de todo el mundo.\n\n' + 
               'Si quieres saber sobre el por qué los árboles del maestro Máximo Pincay son excepcionales pincha /historia .\n\n' + 
               'Si quieres ver la lista de los arboles adoptados pincha /padrinos .\n\n' +
               'Si adoptar un árbol geolocalizado de Maestro Pincay pincha /adopcion .\n\n' +
               'Si necesitas recordar los comandos pincha /ayuda'
               )
    dbCount(ctx)
})

app.help((ctx) => {
    ctx.reply( 'Si quieres saber sobre el por qué los árboles del maestro Máximo Pincay son excepcionales pincha /historia .\n\n' + 
    'Si quieres ver la lista de los arboles adoptados pincha /padrinos .\n\n' +
    'Si adoptar un árbol geolocalizado de Maestro Pincay pincha /adopcion .\n\n' +
    'Si necesitas recordar los comandos pincha /ayuda'
    )
    dbCount(ctx)
})

// app.command('revoke', async ( ctx ) => {
//     const response = await ctx.revokeChatInviteLink( "" )
//     console.log(response)
// })

app.command('test', ( ctx ) => {
    ctx.replyWithDice()
})

app.command('ayuda', ( ctx ) => {
    ctx.reply( 'Si quieres saber sobre el por qué los árboles del maestro Máximo Pincay son excepcionales pincha /historia .\n\n' + 
               'Si quieres ver la lista de los arboles adoptados pincha /padrinos .\n\n' +
               'Si adoptar un árbol geolocalizado de Maestro Pincay pincha /adopcion .\n\n' +
               'Si necesitas recordar los comandos pincha /ayuda'
               )
    dbCount(ctx)
})

app.command('historia', ( ctx ) => {
    ctx.replyWithMarkdown(
        `🌳🌳🌳🌳🌳🌳 *La Magnífica Historia del PMA12* 🌳🌳🌳🌳🌳🌳

        Ecuador fue el país de mayor exportación de cacao en la década de
        los 1890, exportando exclusivamente cacao fino de aroma (Nacional
        / Sabor arriba). Sin embargo, con la aparición de nuevas variedades
        de injertos naturales (léase cacao trinitario) la eficiencia de la
        industria cacaotera ecuatoriana fue perdiendo mermando. Como
        respuesta a la fuerte competencia en el sector, surge en Ecuador
        una nueva de variedad de cacao llamado el CCN-51.

        La variedad en sí es una cosa hermosa, mientras mayor variedad
        genética encontramos en el mundo, más alegres deberíamos estar.
        Pero a nivel comercial el CNN51 se comporta como una verdadera
        plaga. Pues dada su alta productividad los cacao cultores en
        Ecuador (y es una tendencia que puede amenazar a toda América
        latina) cambian sus cultivos de variedades de cacao ancestrales por
        el ácido CCN-51. 

        En reacción a este despropósito en el sabor y calidad del chocolate,
        el Maestro Máximo Pincay realizó una hazaña que está pasando
        inadvertida a los amantes del chocolate en el mundo. Tal como habría
        hecho el Dr. Mendel, cruzó diferentes 'individuos' de una misma
        variedad para obtener un árbol de variedad ancestral fortalecida.
        Este era el árbol número 12 de la primera hilera y por eso el nombre
        de PMA12. Una historia que todos los padrinos de sus árboles sabrán
        apreciar.

        🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳💎🌳🌳🌳🌳🌳🌳🌳🌳🌳
        `)
    //dbCount(ctx)
})


app.command('padrinos', ( ctx ) => {
    ctx.reply('@carlanto5000 ha adoptado 4 árboles\n\t\t///dispuestos.ayudada.arriesgar\n\t\t///alergias.ventanal.inquietud\n\t\t///rangos.cúpula.comisura\n\t\t///cocine.probados.acompaña')
    dbCount(ctx)
})

app.command('adopcion', ( ctx ) => {
    ctx.replyWithMarkdown(
        ` 🤖 Adopta un árbol de cacao PMA12 geolocalizado directamente de la hacienda del Maestro Máximo Pincay ❤️🌳🍫.
        ${products.reduce((acc, p) => { return (acc += `*${p.name}* - ${p.price} €\n [🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳](${p.photoUrl})`)
        },'')}`, Markup.keyboard(products.map(p => p.name)).oneTime().resize())
    dbCount(ctx)
})

app.command('vendita', ( ctx ) => {
    ctx.replyWithMarkdown(
        ` 🤖 Metti in adopzione un árbol de cacao PMA12 geolocalizado directamente de la hacienda del Maestro Máximo Pincay ❤️🌳🍫.
        ${products2.reduce((acc, p) => { return (acc += `*${p.name}* - ${p.price} €\n [🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳🌳](${p.photoUrl})`)
        },'')}`, Markup.keyboard(products2.map(p => p.name)).oneTime().resize())
    dbCount(ctx)
})

// Order product
products.forEach(p => {
    app.hears(p.name, (ctx) => {
        console.log(`${ctx.from.first_name} sta ordinando un/a ${p.name}.`)
        ctx.replyWithInvoice(createInvoice(p))
    })
})

app.on('chat_join_request', async (ctx) => {
    console.log(ctx.update.chat_join_request)
    let referer = ctx.update.chat_join_request.invite_link.name
    console.log("Referer", referer)
    console.log("Referee", ctx.update)
    let user = await User.find({ username: referer })
    if( user.username === referer ) {
        newUser(ctx)
    }
})

// app.on('audio', ctx => {
//     console.log(ctx)
// })

app.on('dice', ctx => {
    console.log("It was a dice!")
})

app.on('sticker', (ctx) => ctx.reply('👍 sticker'))
app.on('location', (ctx) => ctx.reply('👍 location'))
app.on('new_chat_participant', (ctx) => ctx.reply('👍 new_chat_participant'))

// Handle payment callbacks
app.on('pre_checkout_query', ( ctx ) => ctx.answerPreCheckoutQuery(true))
app.on('successful_payment', ( ctx ) => {
    console.log(`${ctx.from.first_name} (${ctx.from.username}) ha pagato ${ctx.message.successful_payment.total_amount / 100} €.`)
    ctx.reply("Gracias por tu adopción")
    // TODO: Count a adoption.
    // TODO: Send email.
})

app.on('message', (ctx) => {
    console.log(ctx.update)
})

// app.command('sendLocation', (ctx) => {
//     console.log("Location", ctx.message)
// })

app.startPolling()
