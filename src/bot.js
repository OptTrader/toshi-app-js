const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')

let bot = new Bot()

// ROUTING

bot.onEvent = function(session, message) {
    switch (message.type) {
        case 'Init':
            welcome(session)
            break
        case 'Message':
            onMessage(session, message)
            break
        case 'Command':
            onCommand(session, message)
            break
        case 'Payment':
            onPayment(session, message)
            break
        case 'PaymentRequest':
            welcome(session)
            break
    }
}

function onMessage(session, message) {
    welcome(session)
}

function onCommand(session, command) {
    switch (command.content.value) {
        case 'donate':
            donate(session)
            break
        case 'atm':
            atm(session)
            break
    }
}

function onPayment(session, message) {
    if (message.fromAddress == session.config.paymentAddress) {
        // handle payments sent by the bot
        if (message.status == 'confirmed') {
            // perform special action once the payment has been confirmed
            // on the network
            sendMessage(session, `^^ 💰 💯`);
        } else if (message.status == 'error') {
            // oops, something went wrong with a payment we tried to send!
        }
    } else {
        // handle payments sent to the bot
        if (message.status == 'unconfirmed') {
            // payment has been sent to the ethereum network, but is not yet confirmed
            sendMessage(session, `Thanks for the payment! The 💰 is used for the translator! 🙏`);
        } else if (message.status == 'confirmed') {
            // handle when the payment is actually confirmed!
        } else if (message.status == 'error') {
            sendMessage(session, `There was an error with your payment! Doh! 🚫`);
        }
    }
}

// STATES

function welcome(session) {
    sendMessage(session, `Hello! Welcome to the Translator on Toshi!`)
    sendMessage(session, `If you want to say hi, ping @chriskong`)
}

// example of how to store state on each user
function donate(session) {
    // request $1 USD at current exchange rates
    Fiat.fetch().then((toEth) => {
        session.requestEth(toEth.USD(1))
    })
}

function atm(session) {
    // send $0.10 USD at current exchange rates
    let amt = 0.1

    let count = (session.get('count') || 0) + amt
    session.set('count', count)

    Fiat.fetch().then((toEth) => {
        session.sendEth(toEth.USD(amt))
        sendMessage(session, `Sent ${amt} 💰🤑💰`)
        sendMessage(session, `FYI you've recieved ${count} eth from me so far 😎`)
    })
}

// HELPERS

function sendMessage(session, message) {
    let controls = [
        { type: 'button', label: 'Donate 💰', value: 'donate' },
        { type: 'button', label: 'Get 💰', value: 'atm' }
    ]
    session.reply(SOFA.Message({
        body: message,
        controls: controls,
        showKeyboard: false,
    }))
}