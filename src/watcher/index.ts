require('dotenv').config()

const _g = require('../_g')
const config = _g.config

import { send_alerts } from '../helpers/alert'
import { update_witness, get_witness_by_account, set_initial_witness, get_next_key } from '../helpers/steem'
import { initiate_active_key_cryptographie } from '../helpers/cryptography'
import { check_missing_env } from '../helpers/essentials';

let rotation_round = 0

let start = async (error = false) => {
  try {
    if (!error) {
      if (config.ENABLE_ENCRYPTION) {
        await initiate_active_key_cryptographie()
      } else {
        _g.ACTIVE_KEY = process.env.ACTIVE_KEY
      }
    }

    while (true) {
      await watch_witness()
      await _g.timeout(config.INTERVAL * 60)
    }
  } catch (e) {
    console.error('start', e)
    await start(true)
  }
}



let watch_witness = async () => {
  try {
    if (_g.start_total_missed === 99999) {
      console.log('\n----------------------------\n')
      console.log('Initiating Witness Watcher')
      await check_missing_env()
      let x = await get_witness_by_account()
      if (x) {
        set_initial_witness(x)
        console.log(`Witness: ${config.WITNESS} | Current Total Missed Blocks: ${_g.start_total_missed} | Threshold: ${config.MISSED_BLOCKS_THRESHOLD}`)
        console.log(`Alerts: ${config.ALERT_METHODS}`)
        console.log(`Signing Keys: ${config.SIGNING_KEYS}`)
        console.log(`Next Backup Key: ${_g.CURRENT_BACKUP_KEY !== _g.NULL_KEY ? _g.CURRENT_BACKUP_KEY : `No Backup Keys - Disabling Witness Directly`}`)
        console.log(`KEY ROTATION: ${config.ROTATE_KEYS ? `ENABLED (${config.ROTATE_ROUNDS > -1 ? config.ROTATE_ROUNDS : 'INFINITE'} ROUNDS)` : `DISABLED`} ${config.TEST_MODE ? 'Test-Mode: ENABLED' : ''}`)
        console.log('\n----------------------------\n')
        _g.log('Witness Watcher: Active\n')
      }
    }
    
    let witness = await get_witness_by_account()
    // Was witness manually disabled?
    if (witness.signing_key === _g.NULL_KEY) {
      _g.log('Witness is disabled - skipping checking.')
      return
    } 
    // Was the current signing key manually changed?
    else if (witness.signing_key === _g.CURRENT_BACKUP_KEY) {
      update_signing_keys()
    }

    // Did we miss a block?
    if (witness.total_missed > _g.current_total_missed) {
      let missed_since_start = witness.total_missed - _g.start_total_missed
      _g.log('[ DANGER ] Missed a Block!')

      if (config.ALERT_AFTER_EVERY_MISSED) {
        await send_alerts(`Missed Block!`, `Witness missed 1 Block!${missed_since_start < config.MISSED_BLOCKS_THRESHOLD ? ` ${missed_since_start} more until failover.` : ''}`, true)
      }
      
      // Is the current missed count >= than what the threshold is?
      if (missed_since_start >= config.MISSED_BLOCKS_THRESHOLD) {

        // No Backupkey? Disabling Witness!
        if (!_g.CURRENT_BACKUP_KEY) _g.CURRENT_BACKUP_KEY = _g.NULL_KEY

        await update_witness(_g.CURRENT_BACKUP_KEY, false, true)

        _g.start_total_missed = _g.current_total_missed = witness.total_missed
        // No Backupkey? Disabling Witness!
        if (_g.CURRENT_BACKUP_KEY === _g.NULL_KEY) {
          _g.log('Exiting now due to disabled Witness')
          await _g.timeout(5 * 60)
          process.exit(-1)
        } else {
          update_signing_keys()
        }

      } else {
        _g.current_total_missed = witness.total_missed
      }
    }
  } catch (error) {
    console.error('watch_witness', error)
    await watch_witness()
  }
}

/**
 * Rotate through signing-keys, customized for witness-watcher. Remote uses a simpler version.
 */
let update_signing_keys = () => {
  _g.USED_SIGNING_KEYS.push(_g.CURRENT_BACKUP_KEY)
  let index = config.SIGNING_KEYS.indexOf(_g.CURRENT_BACKUP_KEY)

  if (index >= (config.SIGNING_KEYS.length - 1)) {
    if (config.ROTATE_KEYS && (config.ROTATE_ROUNDS > rotation_round || config.ROTATE_ROUNDS === -1)) {
      _g.USED_SIGNING_KEYS = []
      _g.CURRENT_BACKUP_KEY = config.SIGNING_KEYS[0]
      rotation_round += 1
    } else {
      _g.CURRENT_BACKUP_KEY = _g.NULL_KEY
    }
  } else {
    _g.CURRENT_BACKUP_KEY = config.SIGNING_KEYS[index + 1]
  }
}

start()