const _g = require('../_g')
const config = _g.config

export let check_missing_env = async () => {
  try {
    console.log('Checking .env & config')
    let env_missing = []

    if (!_g.ACTIVE_KEY && config.ENABLE_ENCRYPTION) env_missing.push('ACTIVE_KEY is not decrypted')

    if (!process.env.ENCRYPTED_ACTIVE_KEY && config.ENABLE_ENCRYPTION) env_missing.push('ENCRYPTED_ACTIVE_KEY')
    if (!process.env.ACTIVE_KEY && !config.ENABLE_ENCRYPTION) env_missing.push('ACTIVE_KEY')

    if (config.ALERT_METHODS.includes('SMS')) {
      if (!process.env.PHONE_NUMBER) env_missing.push('PHONE_NUMBER')
      if (!process.env.API_KEY) env_missing.push('API_KEY')
      if (!process.env.API_SECRET) env_missing.push('API_SECRET')
      if (config.SMS_PROVIDER === _g.enums.twilio && !process.env.FROM_NUMBER) env_missing.push('FROM_NUMBER')
    }

    if (config.ALERT_METHODS.includes('EMAIL')) {
      if (!process.env.GOOGLE_MAIL_ACCOUNT) env_missing.push('GOOGLE_MAIL_ACCOUNT')
      if (!process.env.GOOGLE_MAIL_PASSWORD) env_missing.push('GOOGLE_MAIL_PASSWORD')
    }

    if (config.ALERT_METHODS.includes('TELEGRAM')) {
      if (!process.env.TELEGRAM_BOT_TOKEN) env_missing.push('TELEGRAM_BOT_TOKEN')
      if (!process.env.TELEGRAM_PASSWORD) env_missing.push('TELEGRAM_PASSWORD')
      if (!process.env.TELEGRAM_USER_ID) env_missing.push('TELEGRAM_USER_ID')
    }

    if (env_missing.length > 0) {
      if (env_missing.length > 0) _g.log(`Missing .env variables: ${env_missing}`)
      process.exit(-1)
    }
    console.log('Check was successful!')
    console.log('\n' + '----------------------------' + '\n')
  } catch (e) {
    console.error('check_missing_variables', e)
    _g.log(`Exiting Process.`)
    process.exit(-1)
  }
}