require('dotenv').config()
const _g = require('../_g')

import { get_witness_by_account, update_witness } from '../helpers/steem'
import { initiate_active_key_cryptographie } from '../helpers/cryptography'
const { ENABLE_ENCRYPTION } = _g.config

let start = async () => {
  if (ENABLE_ENCRYPTION) {
    await initiate_active_key_cryptographie()
  } else {
    _g.ACTIVE_KEY = process.env.ACTIVE_KEY
  }

  let res = await get_witness_by_account()
  _g.WITNESS_URL = res.url
  _g.PROPS = res.props
  _g.ORIG_KEY = res.signing_key

  await update_witness(_g.NULL_KEY, true)
}

start()