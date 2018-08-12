import * as dsteem from 'dsteem'

const fs = require('fs')

export let config = require('../configs_schema/config.js').get()
export let config_pricefeed = require('../configs_schema/config.pricefeed.js').get()
export const retries = 3

export const RPC_NODES = config.RPC_NODES

export const NULL_KEY = 'STM1111111111111111111111111111111114T1Anm'
export let ACTIVE_KEY = ''
export let ORIG_KEY = ''

export let start_total_missed = 99999
export let current_total_missed = 99999
export let USED_SIGNING_KEYS = []
export let CURRENT_BACKUP_KEY = config.SIGNING_KEYS[0]

export let WITNESS_URL = 'https://steemit.com'
export let PROPS: dsteem.ChainProperties = config.PROPS || { account_creation_fee: '0.100 STEEM', maximum_block_size: 65536, sbd_interest_rate: 0 }

export let timeout = (sec) => {
  return new Promise(resolve => setTimeout(resolve, sec * 1000))
}

export const enums = {
  twilio: 'twilio',
  nexmo: 'nexmo'
}

export let log = (...args) => {
  console.log(`${new Date().toISOString()} - ${args}`)
} 