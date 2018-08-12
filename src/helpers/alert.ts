require('dotenv').config()
import * as nodemailer from 'nodemailer'
import * as _g from '../_g'
const twilio = require('twilio')
const request = require('superagent')

let config = _g.config

/**
 * Send all selected alert methods inside the config
 * @param force Whther sending should be forced
 */
export let send_alerts = async (subject, message, force = false) => {
  try {
    for (let alert_method of config.ALERT_METHODS) {
      if (alert_method === 'SMS' && !config.TEST_MODE) {
        send_sms(message, force)
      } else if (alert_method === 'EMAIL') {
        send_email(subject, message, force)
      } else if (alert_method === 'TELEGRAM') {
        send_telegram(message, force)
      }
    }
  } catch (error) {
    console.error('send_alert', error)
  }
}

/**
 * Send a message through Telegram. TELEGRAM_USER_ID has to be defined first.
 * @param force Whther sending should be forced
 */
export let send_telegram = async (message, force = false, retries = 0) => {
  try {
    if (!config.TEST_MODE || force) {
      const Telegraf = require('telegraf')

      const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

      bot.telegram.sendMessage(process.env.TELEGRAM_USER_ID, message)
      _g.log(`Send Telegram`)
    } else {
      _g.log(`Test-Mode Telegram: ${message}`)
    }
  } catch (e) {
    console.error('send_telegram', e)
    if (retries < _g.retries) {
      await _g.timeout(1)
      await send_telegram(message, force, retries += 1)
    }
  }
}

/**
 * Send an email over GMAIL
 * @param force Whther sending should be forced
 */
export let send_email = async (subject, message, force = false, retries = 0) => {
  try {
    if (!config.TEST_MODE || force) {
      let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 465, secure: true,
        auth: {
          user: process.env.GOOGLE_MAIL_ACCOUNT,
          pass: process.env.GOOGLE_MAIL_PASSWORD
        }
      })
      let mailOptions = {
        from: config.EMAIL_FROM, to: config.EMAIL_TO,
        subject: `Witness Watcher - ${subject}`, text: message
      }
      await transporter.sendMail(mailOptions)
      _g.log(`Send Email`)
    } else {
      _g.log(`Test-Mode Email: ${subject} - ${message}`)
    }
  } catch (error) {
    _g.log('send_email', error.message)
    if (retries < _g.retries) {
      await _g.timeout(1)
      await send_email(subject, message, force, retries += 1)
    }
  }
}

/**
 * Send a SMS via your specified provider
 * @param force Whther sending should be forced
 */
export let send_sms = async (message, force = false, retries = 0) => {
  try {
    if (!config.TEST_MODE || force) {
      let response = null
      if (config.SMS_PROVIDER === _g.enums.nexmo) {
        response = await request.post('https://rest.nexmo.com/sms/json')
          .query({ to: process.env.PHONE_NUMBER, from: 'Witness', text: message, api_key: process.env.API_KEY, api_secret: process.env.API_SECRET })
      } else if (config.SMS_PROVIDER === _g.enums.twilio) {
        const client = new twilio(process.env.API_KEY, process.env.API_SECRET)
        response = await client.messages.create({ to: process.env.PHONE_NUMBER, from: process.env.FROM_NUMBER, body: message })
      }
      _g.log(`Send SMS`)
      return response
    } else {
      _g.log(`Test-Mode SMS: ${message}`)
    }
  } catch (e) {
    _g.log(`send_sms`, e.message)
    if (retries < _g.retries) {
      await _g.timeout(1)
      await send_sms(message, force, retries += 1)
    }
  }
}