require('dotenv').config()

const _g = require('../_g')
const { ENABLE_ENCRYPTION, BACKUP_KEYS, WITNESS, RPC_NODES, MISSED_BLOCKS_THRESHOLD, TEST_MODE, USE_SMS_ALERT, SMS_PROVIDER, ALERT_AFTER_EVERY_MISSED, INTERVAL_WATCHER, ROTATE_KEYS, ROTATE_ROUNDS } = _g.config
import { send_sms } from '../helpers/sms'
import { update_witness, get_witness_by_account } from '../helpers/steem'
import { initiate_active_key_cryptographie } from '../helpers/cryptography'

let start_total_missed: number = 99999
let current_total_missed: number = start_total_missed
let CURRENT_BACKUP_KEY = BACKUP_KEYS[0]
let USED_BACKUP_KEYS = []
let rotation_round = 0

let start = async () => {
  try {
    if (ENABLE_ENCRYPTION) {
      await initiate_active_key_cryptographie()
    } else {
      _g.ACTIVE_KEY = process.env.ACTIVE_KEY
    }

    while (true) {
      await watch_witness()
      await _g.timeout(INTERVAL_WATCHER * 60)
    }
  } catch (e) {
    console.error('start', e)
    start()
  }
}

let check_missing_variables = async () => {
  try {
    _g.log('Checking .env & config')
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

    if (env_missing.length > 0 || config_missing.length > 0) {
      if (env_missing.length > 0) _g.log(`Missing .env variables: ${env_missing}`)
      if (config_missing.length > 0) _g.log(`Missing config variables: ${config_missing}`)
      process.exit(-1)
    }
    _g.log('Check was successful!')
    _g.log('\n' + '----------------------------' + '\n')
  } catch (e) {
    console.error('check_missing_variables', e)
    _g.log(`Exiting Process.`)
    process.exit(-1)
  }
}

let watch_witness = async () => {
  try {
    if (start_total_missed === 99999) {
      _g.log('\n' + '----------------------------' + '\n')
      _g.log('Initiating Witness-Failover')
      await check_missing_variables()
      let res = await get_witness_by_account()
      if (res) {
        start_total_missed = res.total_missed
        current_total_missed = start_total_missed
        _g.WITNESS_URL = res.url
        _g.PROPS = res.props
        _g.log(`Watching Witness Account: ${WITNESS} for missed blocks. Current total missed blocks: ${start_total_missed}`)
        _g.log(`Allowed missed blocks until failover: ${MISSED_BLOCKS_THRESHOLD}`)
        _g.log(`Backup Keys: ${BACKUP_KEYS.length > 0 ? BACKUP_KEYS : `NO KEYS - Disabling Witness instead directly`}`)
        if (TEST_MODE) _g.log('TEST MODE ENABLED')
      }
    }

    let witness = await get_witness_by_account()
    if (witness.total_missed > current_total_missed) {
      _g.log('[ DANGER ] Missed a Block!')

      let missed_since_start = witness.total_missed - start_total_missed
      if (missed_since_start >= MISSED_BLOCKS_THRESHOLD) {

        //let key = _g.NULL_KEY
        if (!CURRENT_BACKUP_KEY || USED_BACKUP_KEYS.length >= BACKUP_KEYS.length) {
          CURRENT_BACKUP_KEY = _g.NULL_KEY
        }

        if (USE_SMS_ALERT) {
          let result = await send_sms(`Your Witness missed 1 Block!`)
        }

        let update_result = await update_witness(CURRENT_BACKUP_KEY)
        start_total_missed = current_total_missed = witness.total_missed



        if (CURRENT_BACKUP_KEY === _g.NULL_KEY) {
          _g.log('Exiting now due to disabled Witness')
          process.exit(-1)
        } else {
          USED_BACKUP_KEYS.push(CURRENT_BACKUP_KEY)
          let index = BACKUP_KEYS.indexOf(CURRENT_BACKUP_KEY)
          if (index >= BACKUP_KEYS.length) {
            if (ROTATE_KEYS && (ROTATE_ROUNDS > rotation_round || ROTATE_ROUNDS === -1)) {
              USED_BACKUP_KEYS = []
              CURRENT_BACKUP_KEY = BACKUP_KEYS[0]
              rotation_round += 1
            } else {
              CURRENT_BACKUP_KEY = _g.NULL_KEY
            }
          } else {
            CURRENT_BACKUP_KEY = BACKUP_KEYS[index + 1]
          }
        }

      } else {
        current_total_missed = witness.total_missed
        if (USE_SMS_ALERT && ALERT_AFTER_EVERY_MISSED) {
          _g.log('Sending SMS Now!')
          let result = await send_sms(`Your Witness missed 1 Block! Only ${missed_since_start} more until failover.`)
        }
      }
    }
  } catch (error) {
    console.error('watch_witness',error)
    await watch_witness()
  }
}

start()