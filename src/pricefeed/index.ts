require('dotenv').config()

import { bittrex_price, binance_price, huobi_price, upbit_price, poloniex_price } from './exchanges'
import { get_account, publish_feed } from '../helpers/steem'
import { initiate_active_key_cryptographie } from '../helpers/cryptography'
const _g = require('../_g')

let { EXCHANGES, INTERVAL_FEED, ENABLE_ENCRYPTION } = _g.config

let start = async () => {
  if (ENABLE_ENCRYPTION) {
    await initiate_active_key_cryptographie()
  } else {
    _g.ACTIVE_KEY = process.env.ACTIVE_KEY
  }
  console.log('\n' + '----------------------------' + '\n')
  console.log('Starting Pricefeed')
  console.log('\n' + '----------------------------' + '\n')
  await main()
}

let main = async () => {
  try {
    while (true) {
      let result = await update_pricefeed()
      if (!result) _g.log('Something went wrong. Retrying in 10 sec.')
      await _g.timeout(result ? INTERVAL_FEED * 60 : 10)
    }
  } catch (error) {
    await main()
  }
  
}

let update_pricefeed = async () => {
  try {
    let promises = []

    if (EXCHANGES.includes('bittrex')) promises.push(bittrex_price())
    if (EXCHANGES.includes('binance')) promises.push(binance_price())
    if (EXCHANGES.includes('huboi')) promises.push(huobi_price())
    if (EXCHANGES.includes('upbit')) promises.push(upbit_price())
    if (EXCHANGES.includes('poloniex')) promises.push(poloniex_price())
    let x = await Promise.all(promises)
    let prices = []

    for (let p of x) {
      if (p && p > 0 && !isNaN(p)) {
        prices.push(p)
      }
    }

    const price = prices.reduce((x, y) => x + y) / prices.length

    if (!isNaN(price) && price > 0) {
      await publish_feed(price)
    }
    return true
  } catch (e) {
    console.error('update_pricefeed', e)
    return false
  }

}

start()