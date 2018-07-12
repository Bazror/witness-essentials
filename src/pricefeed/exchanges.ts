import axios from 'axios'
import * as _g from '../_g'

export let bittrex_price = async () => {
  try {
    let BTC_USD = (await axios.get('https://bittrex.com/api/v1.1/public/getticker?market=USDT-BTC')).data.result
    let BTC_STEEM = (await axios.get('https://bittrex.com/api/v1.1/public/getticker?market=BTC-STEEM')).data.result

    BTC_USD = JSON.parse(JSON.stringify(BTC_USD)).Last
    BTC_STEEM = JSON.parse(JSON.stringify(BTC_STEEM)).Last

    _g.log(`Bittrex ${BTC_STEEM * BTC_USD}$`)
    return BTC_STEEM * BTC_USD
  } catch (error) {
    console.error(`bittrex_price`, error)
    return 0
  }
}

export let binance_price = async () => {
  try {
    let BTC_USD = (await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')).data
    let BTC_STEEM = (await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=STEEMBTC')).data

    BTC_USD = JSON.parse(JSON.stringify(BTC_USD)).price
    BTC_STEEM = JSON.parse(JSON.stringify(BTC_STEEM)).price

    _g.log(`Binance ${BTC_STEEM * BTC_USD}$`)
    return BTC_STEEM * BTC_USD
  } catch (error) {
    console.error(`binance_price`, error)
    return 0
  }
}

export let huobi_price = async () => {
  try {

    let BTC_USD = (await axios.get('https://api.huobi.pro/market/detail/merged?symbol=btcusdt')).data
    let BTC_STEEM = (await axios.get('https://api.huobi.pro/market/detail/merged?symbol=steembtc')).data


    BTC_USD = JSON.parse(JSON.stringify(BTC_USD)).tick.close
    BTC_STEEM = JSON.parse(JSON.stringify(BTC_STEEM)).tick.close

    _g.log(`Huobi ${BTC_STEEM * BTC_USD}$`)
    return BTC_STEEM * BTC_USD
  } catch (error) {
    console.error(`huobi_price`, error)
    return 0
  }
}


export let upbit_price = async () => {
  try {

    let BTC_USD = (await axios.get('https://crix-api-endpoint.upbit.com/v1/crix/candles/minutes/1?code=CRIX.UPBIT.USDT-BTC')).data[0]
    let BTC_STEEM = (await axios.get('https://crix-api-endpoint.upbit.com/v1/crix/candles/minutes/1?code=CRIX.UPBIT.BTC-STEEM')).data[0]

    BTC_USD = JSON.parse(JSON.stringify(BTC_USD)).tradePrice
    BTC_STEEM = JSON.parse(JSON.stringify(BTC_STEEM)).tradePrice

    _g.log(`Upbit ${BTC_STEEM * BTC_USD}$`)
    return BTC_STEEM * BTC_USD
  } catch (error) {
    console.error(`upbit_price`, error.message)
    return 0
  }
}

export let poloniex_price = async () => {
  try {
    let Ticker = (await axios.get('https://poloniex.com/public?command=returnTicker')).data

    let BTC_USD = JSON.parse(JSON.stringify(Ticker))['USDT_BTC'].last
    let BTC_STEEM = JSON.parse(JSON.stringify(Ticker))['BTC_STEEM'].last

    _g.log(`Poloniex ${BTC_STEEM * BTC_USD}$`)
    return BTC_STEEM * BTC_USD
  } catch (error) {
    console.error(`poloniex_price`, error.message)
    return 0
  }
}