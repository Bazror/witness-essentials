import * as dsteem from 'dsteem'
//import { Client } from 'dsteem-pool'
import * as steem from 'steem-js-witness-fix'
const _g = require('../_g')

import { send_alerts } from './alert'

let config = _g.config
let rpc_node = config.RPC_NODES ? config.RPC_NODES[0] : 'https://api.steemit.com'

let client = new dsteem.Client(rpc_node, { timeout: 8 * 1000 })

/**
 * Update the witness data
 * @param key Signing Key
 * @param command Whether it is a command which will not trigger alerts
 * @param change_key Is the signing-key being changed?
 */
export let update_witness = async (key, command = false, change_key = false, ctx = null, retries = 0) => {
  try {
    if (!config.TEST_MODE) {
      if (key === _g.NULL_KEY) {
        steem.broadcast.witnessUpdate(_g.ACTIVE_KEY, config.WITNESS, _g.WITNESS_URL, _g.NULL_KEY, _g.PROPS, '0.000 STEEM', async (e, result) => {
          if (!e) {
            _g.log('Disabled Witness')
            if (!command) {
              await send_alerts('Disabled Witness', `Successfully disabled Witness.`)
            } else if(ctx) {
              ctx.reply(`Disabled Witness.`)
            }
          } else {
            console.error('Disabling Witness', e)
            if (!command) {
              await send_alerts('Error: Disabling Witness', `Couldn't disable Witness. ${e}`)
            } else if(ctx) {
              ctx.reply(`Error while disabling Witness ${e}`)
            }
          }
        })
      } else {
        let op: dsteem.WitnessUpdateOperation = ['witness_update', {
          block_signing_key: key, fee: '0.000 STEEM', owner: config.WITNESS, props: _g.PROPS, url: _g.WITNESS_URL
        }]
        await client.broadcast.sendOperations([op], dsteem.PrivateKey.from(_g.ACTIVE_KEY))

        _g.log(`Updated Witness to ${key}`)
        if (!command && change_key) {
          await send_alerts(`Updated Signing Key`, `Updated Signing Key to ${key}`)
        } else if (ctx) {
          ctx.reply(`Updated Signing Key to ${key}`)
        }
      }
    } else {
      _g.log(`Test-Mode: Would have updated to ${key}.`)
      await send_alerts('Test: Updates Witness', `Test-Mode: Would have updated to ${key}.`, true)
    }
  } catch (e) {
    console.error('update_witness', e)
    if (retries < _g.retries) {
      await _g.timeout(1)
      await update_witness(key, command, change_key, ctx, retries += 1)
    } else {
      rpc_failover()
      await update_witness(key, command, change_key, ctx, 0)
    }
  }
}

export let get_witness_by_account = async (retries = 0) => {
  try {
    let witness = await client.call('database_api', 'get_witness_by_account', [config.WITNESS])
    if (witness) {
      return witness
    } else {
      throw 'Invalid Witness Object'
    }
  } catch (e) {
    console.error('get_witness_by_account', e)
    if (retries < _g.retries) {
      await _g.timeout(1)
      await get_witness_by_account(retries += 1)
    } else {
      rpc_failover()
      await get_witness_by_account(0)
    }
  }
}

export let key_valid = (key, key_auths) => {
  let pub = steem.auth.wifToPublic(key)
  let filter = key_auths.filter(x => x[0] === pub)
  return filter.length > 0
}

export let get_account = async (name, retries = 0) => {
  try {
    let acc = await client.database.getAccounts([name])
    return acc[0]
  } catch (error) {
    if (retries < _g.retries) {
      await _g.timeout(1)
      await get_account(name, retries += 1)
    } else {
      rpc_failover()
      await get_account(name, 0)
    }
  }
}

export let publish_feed = async (price, retries = 0) => {
  try {
    let exchange_rate = new dsteem.Price(dsteem.Asset.fromString(`${price.toFixed(3)} SBD`), dsteem.Asset.fromString(`${(1 / (config.PEG ? config.PEG : 1)).toFixed(3)} STEEM`))
    let op: dsteem.FeedPublishOperation = ['feed_publish', { exchange_rate, publisher: config.WITNESS }]
    await client.broadcast.sendOperations([op], dsteem.PrivateKey.from(_g.ACTIVE_KEY))
    _g.log(`Published Pricefeed ${exchange_rate}`)
  } catch (error) {
    console.error(error)
    if (retries < _g.retries) {
      await _g.timeout(1)
      await publish_feed(price, retries += 1)
    } else {
      rpc_failover()
      await publish_feed(price, 0)
    }
  }

}

let rpc_failover = () => {
  try {
    if (config.RPC_NODES && config.RPC_NODES.length > 1) {
      let index: number = config.RPC_NODES.indexOf(rpc_node) + 1

      if (index === config.RPC_NODES.length) index = 0

      rpc_node = config.RPC_NODES[index]

      client = new dsteem.Client(rpc_node, { timeout: 8 * 1000 })
      _g.log(`Failed over to ${rpc_node} RPC-Node`)
    }
  } catch (e) {
    console.error('rpc_failover', e)
    return false
  }
}

export let set_initial_witness = (x) => {
  _g.start_total_missed = x.total_missed
  _g.current_total_missed = _g.start_total_missed
  _g.WITNESS_URL = x.url
  _g.PROPS = x.props
  _g.ORIG_KEY = x.signing_key
  //_g.BACKUP_KEYS_INCL_SIGNING = [x.signing_key].concat(config.BACKUP_KEYS)
  _g.USED_SIGNING_KEYS = [x.signing_key]
  _g.CURRENT_BACKUP_KEY = get_next_key(x.signing_key, false)
}

export let get_next_key = (key, infinite = false) => {
  let index = config.SIGNING_KEYS.indexOf(key)

  if (index >= (config.SIGNING_KEYS.length - 1)) {
    if (infinite) {
      return config.SIGNING_KEYS[0]
    } else {
      return _g.NULL_KEY
    }
  } else {
    return config.SIGNING_KEYS[index + 1]
  }
  /*if(config.SIGNING_KEYS.length <= 1 && !infinite) {
    return _g.NULL_KEY
  } else {
    for (let x of config.SIGNING_KEYS) {
      if(x !== key) {
        return x
      }
    }
  }*/
}