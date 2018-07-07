import * as dsteem from 'dsteem'

const fs = require('fs')

export let config = JSON.parse(fs.readFileSync('config.json'))
export const retries = 1

export const RPC_NODES = config.RPC_NODES

export const NULL_KEY = 'STM1111111111111111111111111111111114T1Anm'
export let ACTIVE_KEY = ''

export let timeout = (sec) => {
  return new Promise(resolve => setTimeout(resolve, sec * 1000))
}

export const enums = {
  twilio: 'twilio',
  nexmo: 'nexmo'
}

export let WITNESS_URL = 'https://steemit.com'
export let PROPS: dsteem.ChainProperties = { account_creation_fee: '0.100 STEEM', maximum_block_size: 65536, sbd_interest_rate: 0 }

export let log = (...args) => {
  console.log(`${new Date().toISOString()} - ${args}`)
} 