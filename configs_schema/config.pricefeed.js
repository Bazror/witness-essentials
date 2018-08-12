const convict = require('convict')

let config = convict({
  EXCHANGES: {
    doc: 'Array of Exchanges',
    format: '*',
    default: [
      "bittrex",
      "binance",
      "huboi",
      "upbit",
      "poloniex"
    ],
    arg: "exchanges"
  },
  PEG: {
    doc: 'Peg',
    format: Number,
    default: 1,
    arg: 'peg'
  },
  INTERVAL: {
    doc: 'Interval in Minutes.',
    format: Number,
    default: 60,
    arg: 'interval'
  }
})

config.loadFile('./configs/config.pricefeed.json')
config.validate({ allowed: 'strict' })

module.exports = config