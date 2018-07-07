require('dotenv').config()
import * as nodemailer from 'nodemailer'
import * as _g from '../_g'
const twilio = require('twilio')
const request = require('superagent')

let { EMAIL_TO, EMAIL_FROM, TEST_MODE, SMS_PROVIDER } = _g.config

export let send_email = async (subject, text, force = false, retries = 0) => {
  try {
    if (!TEST_MODE || force) {
      let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.GOOGLE_MAIL_ACCOUNT,
          pass: process.env.GOOGLE_MAIL_PASSWORD
        }
      })
      let mailOptions = {
        from: EMAIL_FROM,
        to: EMAIL_TO,
        subject: `Witness Watcher - ${subject}`,
        text
      }
      await transporter.sendMail(mailOptions)
      _g.log(`Send Email`)
    } else {
      _g.log(`Test-Mode Email: ${subject} - ${text}`)
    }
  } catch (error) {
    _g.log('send_email', error.message)
    if (retries < _g.retries) {
      await _g.timeout(1)
      await send_email(subject, text, force, retries += 1)
    }
  }
}

export let send_sms = async (message, force = false, retries = 0) => {
  try {
    if (!TEST_MODE || force) {
      let response = null
      if (SMS_PROVIDER === _g.enums.nexmo) {
        response = await request.post('https://rest.nexmo.com/sms/json')
          .query({ to: process.env.PHONE_NUMBER, from: 'Witness', text: message, api_key: process.env.API_KEY, api_secret: process.env.API_SECRET })
      } else if (SMS_PROVIDER === _g.enums.twilio) {
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