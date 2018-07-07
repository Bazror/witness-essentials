import * as _g from '../_g'
const twilio = require('twilio')
const request = require('superagent')
let { TEST_MODE, SMS_PROVIDER } = _g.config



export let send_sms = async (message, force = false) => {
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
      return response
    } else {
      _g.log('WOULD HAVE SEND SMS - BUT IN TESTMODE')
    }
  } catch (e) {
    console.error(`Error while sending sms`, e)
    return false
  }
}