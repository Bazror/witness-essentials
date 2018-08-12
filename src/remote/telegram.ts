require('dotenv').config()

const Telegraf = require('telegraf')
const session = require('telegraf/session')
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

import * as commands from '../commands/commands'

const _g = require('../_g')
const config = _g.config

import { get_witness_by_account, set_initial_witness, get_next_key } from '../helpers/steem'
import { initiate_active_key_cryptographie } from '../helpers/cryptography'

let start = async () => {
  try {
    if (config.ENABLE_ENCRYPTION) {
      console.log('here')
      await initiate_active_key_cryptographie()
    } else {
      _g.ACTIVE_KEY = process.env.ACTIVE_KEY
    }

    let x = await get_witness_by_account()
    set_initial_witness(x)
    /*
      Initial Startup when the bot is opened for the first time in telegram
    */
    bot.start((ctx) => ctx.reply(`Welcome to your witness remote control. Use /enable <key> to switch to a different key, /nextkey to rotate between your signing keys and /disable to disable your witness. Your TELEGRAM_USER_ID is ${ctx.chat.id}. Make sure this is inside your .env file.`))

    /*
      Command: /help
    */
    bot.help((ctx) => ctx.reply(`Use /enable <key> to switch to a different key, /nextkey to rotate between your signing keys and /disable to disable your witness. Your TELEGRAM_USER_ID is ${ctx.chat.id}. Make sure this is inside your .env file.`))

    /*
      Session is being set which works inbetween commands
    */
    bot.use(session())

    /*
      Command for confirming password
    */
    bot.command('confirm', async (ctx) => {
      /**
       * Gets the parameter from the ctx object
       */
      let text = ctx.message.text
      let param = text.substring(8, text.length).trim()

      if (param === process.env.TELEGRAM_PASSWORD) {

        if (ctx.session.command === 'enable') {
          await commands.update_key(ctx.session.param, true, false, ctx)

        } else if (ctx.session.command === 'disable') {
          await commands.update_key(_g.NULL_KEY, true, false, ctx)

        } else if(ctx.session.command === 'nextkey') {
          let x = await get_witness_by_account()
          _g.WITNESS_URL = x.url
          _g.PROPS = x.props
          _g.ORIG_KEY = x.signing_key
          let key = get_next_key(x.signing_key, true)
          await commands.update_key(key, true, false, ctx)

        } else {
          ctx.reply(`No command.`)
        }

        /**
         * Resets the current session
         */
        ctx.session.command = ''
        ctx.session.param = ''
      } else {
        return ctx.reply(`Invalid Password. Try again with /confirm.`)
      }
    })


    /*
      Command for changing signing-key. This requires the confirm command afterwards.
    */
    bot.command('enable', (ctx) => {
      let text = ctx.message.text
      let param = text.substring(7, text.length).trim()
      ctx.session.param = param
      ctx.session.command = 'enable'
      return ctx.reply('Please /confirm <password>.')
    })

    /*
      Command for rotating through all signing keys. This requires the confirm command afterwards.
    */
    bot.command('nextkey', (ctx) => {
      ctx.session.command = 'nextkey'
      return ctx.reply('Please /confirm <password>.')
    })

    /*
      Command for disabling witness. This requires the confirm command afterwards.
    */
    bot.command('disable', (ctx) => {
      ctx.session.command = 'disable'
      return ctx.reply('Please /confirm <password>.')
    })

    /**
     * Getting all recent messages and keeps it alive
     */
    bot.startPolling()
  } catch (e) {
    console.error('start', e)
    bot.startPolling()
  }
}

start()