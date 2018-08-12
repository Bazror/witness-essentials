const _g = require('../_g')

import { initiate_active_key_cryptographie } from '../helpers/cryptography'
const config = _g.config

import { get_witness_by_account, update_witness } from '../helpers/steem'

export let cmd_update_key = async (key) => {
  if (config.ENABLE_ENCRYPTION) {
    await initiate_active_key_cryptographie()
  } else {
    _g.ACTIVE_KEY = process.env.ACTIVE_KEY
  }

  let res = await get_witness_by_account()
  _g.WITNESS_URL = res.url
  _g.PROPS = res.props
  _g.ORIG_KEY = res.signing_key

  await update_key(key)
}

export let update_key = async (key, isCommand = true, change_key = false, ctx = null) => {
  if(!key.startsWith('STM')) return console.log('Invalid Key')

  await update_witness(key, isCommand, change_key, ctx)
}