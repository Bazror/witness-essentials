import * as dsteem from 'dsteem'
//import { Client } from 'dsteem-pool'
import * as steem from 'steem-js-witness-fix'
import * as _g from '../_g'

import { send_email } from './alert'

let { RPC_NODES, TEST_MODE, WITNESS, PEG, USE_EMAIL_ALERT } = _g.config
let rpc_node = RPC_NODES ? RPC_NODES[0] : 'https://api.steemit.com'

let client = new dsteem.Client(rpc_node,  { timeout: 8 * 1000 })

export let update_witness = async (key, retries = 0) => {
  try {
    if (!TEST_MODE) {
      if (key === _g.NULL_KEY) {
        steem.broadcast.witnessUpdate(_g.ACTIVE_KEY, WITNESS, _g.WITNESS_URL, _g.NULL_KEY, _g.PROPS, '0.000 STEEM', async (error, result) => {
          _g.log(error, result)
          if(!error) {
            _g.log('Disabled Witness')
            if(USE_EMAIL_ALERT) await send_email(`Disabled Witness`, `Successfully disabled Witness.`)
          } else {
            console.error(error)
            if(USE_EMAIL_ALERT) await send_email(`Error`, `Couldn't disable Witness`)
          }
        })
      } else {
        let op: dsteem.WitnessUpdateOperation = ['witness_update', { block_signing_key: key, fee: '0.000 STEEM', owner: WITNESS, props: _g.PROPS, url: _g.WITNESS_URL }]
        await client.broadcast.sendOperations([op], dsteem.PrivateKey.from(_g.ACTIVE_KEY))
        _g.log(`Updated Witness to ${key}`)
      }
    } else {
      _g.log(`Test-Mode: Would have updated to ${key}.`)
    }
  } catch (e) {
    console.error('update_witness', e)
    if (retries < _g.retries) {
      await _g.timeout(1)
      await update_witness(key, retries += 1)
    } else {
      rpc_failover()
      await update_witness(key, 0)
    }
  }
}

export let get_witness_by_account = async (retries = 0) => {
  try {
    let witness = await client.call('database_api', 'get_witness_by_account', [WITNESS])
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
    let exchange_rate = new dsteem.Price(dsteem.Asset.fromString(`${price.toFixed(3)} SBD`), dsteem.Asset.fromString(`${(1 / (PEG ? PEG : 1)).toFixed(3)} STEEM`))
    let op: dsteem.FeedPublishOperation = ['feed_publish', { exchange_rate, publisher: WITNESS }]
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
    if (RPC_NODES && RPC_NODES.length > 1) {
      let index: number = RPC_NODES.indexOf(rpc_node) + 1

      if (index === RPC_NODES.length) index = 0

      rpc_node = RPC_NODES[index]

      client = new dsteem.Client(rpc_node, { timeout: 8 * 1000 })
      _g.log(`Failed over to ${rpc_node} RPC-Node`)
    }
  } catch (e) {
    console.error('rpc_failover', e)
    return false
  }
}
