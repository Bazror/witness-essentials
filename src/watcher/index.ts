require('dotenv').config()

const _g = require('../_g')
const { ENABLE_ENCRYPTION, WITNESS, BACKUP_KEYS, RPC_NODES, MISSED_BLOCKS_THRESHOLD, TEST_MODE, USE_SMS_ALERT, USE_EMAIL_ALERT, EMAIL_TO, EMAIL_FROM, SMS_PROVIDER, ALERT_AFTER_EVERY_MISSED, INTERVAL_WATCHER, ROTATE_KEYS, ROTATE_ROUNDS } = _g.config
import { send_sms, send_email } from '../helpers/alert'
import { update_witness, get_witness_by_account } from '../helpers/steem'
import { initiate_active_key_cryptographie } from '../helpers/cryptography'

let start_total_missed: number = 99999
let current_total_missed: number = start_total_missed

let CURRENT_BACKUP_KEY = ''
let USED_BACKUP_KEYS = []
let BACKUP_KEYS_INCL_SIGNING = []

let rotation_round = 0

let start = async (error = false) => {
  try {
    if(!error) {
      if (ENABLE_ENCRYPTION) {
        await initiate_active_key_cryptographie()
      } else {
        _g.ACTIVE_KEY = process.env.ACTIVE_KEY
      }
    }
 
    while (true) {
      await watch_witness()
      console.log(`Waiting ${INTERVAL_WATCHER} minute`)
      await _g.timeout(INTERVAL_WATCHER * 60)
    }
  } catch (e) {
    console.error('start', e)
    await start(true)
  }
}

let check_missing_variables = async () => {
  try {
    console.log('Checking .env & config')
    let env_missing = []
    let config_missing = []

    if (!RPC_NODES || RPC_NODES.length <= 0) config_missing.push('RPC_NODES')
    if (!WITNESS) config_missing.push('WITNESS')
    if (SMS_PROVIDER === 'nexmo|twilio') config_missing.push('SMS_PROVIDER')
    if (!_g.ACTIVE_KEY && ENABLE_ENCRYPTION) env_missing.push('ACTIVE_KEY is not decrypted')
    if (isNaN(Number(MISSED_BLOCKS_THRESHOLD))) config_missing.push('MISSED_BLOCKS_THRESHOLD')

    if (!process.env.ENCRYPTED_ACTIVE_KEY && ENABLE_ENCRYPTION) env_missing.push('ENCRYPTED_ACTIVE_KEY')
    if (!process.env.ACTIVE_KEY && !ENABLE_ENCRYPTION) env_missing.push('ACTIVE_KEY')

    if (USE_SMS_ALERT) {
      if (!process.env.PHONE_NUMBER) env_missing.push('PHONE_NUMBER')
      if (!process.env.API_KEY) env_missing.push('API_KEY')
      if (!process.env.API_SECRET) env_missing.push('API_SECRET')
      if (SMS_PROVIDER === _g.enums.twilio && !process.env.FROM_NUMBER) env_missing.push('FROM_NUMBER')
    }

    if (USE_EMAIL_ALERT) {
      if (!process.env.GOOGLE_MAIL_ACCOUNT) env_missing.push('GOOGLE_MAIL_ACCOUNT')
      if (!process.env.GOOGLE_MAIL_PASSWORD) env_missing.push('GOOGLE_MAIL_PASSWORD')
      if (!EMAIL_TO) config_missing.push('EMAIL_TO')
      if (!EMAIL_FROM) config_missing.push('EMAIL_FROM')
    }

    if (env_missing.length > 0 || config_missing.length > 0) {
      if (env_missing.length > 0) _g.log(`Missing .env variables: ${env_missing}`)
      if (config_missing.length > 0) _g.log(`Missing config variables: ${config_missing}`)
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



let watch_witness = async () => {
  try {
    if (start_total_missed === 99999) {
      console.log('\n----------------------------\n')
      console.log('Initiating Witness Watcher')
      await check_missing_variables()
      let res = await get_witness_by_account()
      if (res) {
        start_total_missed = res.total_missed
        current_total_missed = start_total_missed
        _g.WITNESS_URL = res.url
        _g.PROPS = res.props
        _g.ORIG_KEY = res.signing_key
        BACKUP_KEYS_INCL_SIGNING = [res.signing_key].concat(BACKUP_KEYS)
        USED_BACKUP_KEYS = [res.signing_key]
        CURRENT_BACKUP_KEY = BACKUP_KEYS[0]
        console.log(`Witness: ${WITNESS} | Current Total Missed Blocks: ${start_total_missed} | Threshold: ${MISSED_BLOCKS_THRESHOLD}`)
        console.log(`Alerts: Email = ${USE_EMAIL_ALERT ? 'ENABLED' : 'DISABLED'} | SMS = ${USE_SMS_ALERT ? 'ENABLED' : 'DISABLED'}`)
        console.log(`Backup Keys: ${BACKUP_KEYS.length > 0 ? BACKUP_KEYS : `NO KEYS - Disabling Witness Directly`}`)
        console.log(`KEY ROTATION: ${ROTATE_KEYS ? `ENABLED (${ROTATE_ROUNDS > -1 ? ROTATE_ROUNDS : 'INFINITE'} ROUNDS)` : `DISABLED`} ${TEST_MODE ? 'Test-Mode: ENABLED' : ''}`)
        console.log('\n----------------------------\n')
        console.log('Witness Watcher: Active\n')
      }
    }

    let witness = await get_witness_by_account()
    if (witness.total_missed > current_total_missed) {
      _g.log('[ DANGER ] Missed a Block!')

      let missed_since_start = witness.total_missed - start_total_missed
      if (missed_since_start >= MISSED_BLOCKS_THRESHOLD) {

        if (!CURRENT_BACKUP_KEY) CURRENT_BACKUP_KEY = _g.NULL_KEY

        await update_witness(CURRENT_BACKUP_KEY)

        let message = `Witness missed a block. ${CURRENT_BACKUP_KEY !== _g.NULL_KEY ? `Fellback to ${CURRENT_BACKUP_KEY}` : `Disabled Witness`}.`

        if (USE_SMS_ALERT) await send_sms(message)
        if (USE_EMAIL_ALERT) await send_email(`Missed Block!`, message)

        start_total_missed = current_total_missed = witness.total_missed

        if (CURRENT_BACKUP_KEY === _g.NULL_KEY) {
          _g.log('Exiting now due to disabled Witness')
          await _g.timeout(5 * 60)
          process.exit(-1)
        } else {
          USED_BACKUP_KEYS.push(CURRENT_BACKUP_KEY)

          let index = BACKUP_KEYS_INCL_SIGNING.indexOf(CURRENT_BACKUP_KEY)
          if (index >= (BACKUP_KEYS_INCL_SIGNING.length - 1)) {
            if (ROTATE_KEYS && (ROTATE_ROUNDS > rotation_round || ROTATE_ROUNDS === -1)) {
              USED_BACKUP_KEYS = []
              CURRENT_BACKUP_KEY = BACKUP_KEYS_INCL_SIGNING[0]
              rotation_round += 1
            } else {
              CURRENT_BACKUP_KEY = _g.NULL_KEY
            }
          } else {
            CURRENT_BACKUP_KEY = BACKUP_KEYS_INCL_SIGNING[index + 1]
          }
        }

      } else {
        current_total_missed = witness.total_missed
        if (USE_SMS_ALERT && ALERT_AFTER_EVERY_MISSED) {
          await send_sms(`Witness missed 1 Block! Only ${missed_since_start} more until failover.`)
        }
        if (USE_EMAIL_ALERT) {
          await send_email(`Missed Block!`, `Witness missed 1 Block! Only ${missed_since_start} more until failover.`)
        }
      }
    }
  } catch (error) {
    console.error('watch_witness', error)
    await watch_witness()
  }
}

start()