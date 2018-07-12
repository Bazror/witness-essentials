require('dotenv').config()

const _g = require('../_g')
import { get_witness_by_account, update_witness } from '../helpers/steem'
import { initiate_active_key_cryptographie } from '../helpers/cryptography'
const { ENABLE_ENCRYPTION } = _g.config


let test = async () => {
  if (ENABLE_ENCRYPTION) {
    await initiate_active_key_cryptographie()
  } else {
    _g.ACTIVE_KEY = process.env.ACTIVE_KEY
  }
  _g.log('Testing Witness')
  let res = await get_witness_by_account()
  _g.WITNESS_URL = res.url
  _g.PROPS = res.props
  _g.ORIG_KEY = res.signing_key
  _g.log('Disabling witness now')
  await update_witness(_g.NULL_KEY)
  _g.log(`Waiting 30 seconds. steem-js doesnt support await and we need to wait until the witness has been disabled`)
  await _g.timeout(30)
  _g.log('Enabling witness again')
  await update_witness(_g.ORIG_KEY)
  _g.log('Finished testing')
}

test()