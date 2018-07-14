require('dotenv').config()
import * as readline from 'readline-sync'

const _g = require('../_g')
import { get_witness_by_account, update_witness } from '../helpers/steem'
import { initiate_active_key_cryptographie } from '../helpers/cryptography'
const { ENABLE_ENCRYPTION, PROPS, WITNESS } = _g.config

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

  let witness_url = readline.question(`What should be the witness URL? [${res.url}] : `)
  let account_creation_fee = Number(readline.question(`How high should be the account creation fee? (number only - without STEEM) [${res.props.account_creation_fee}] : `))
  let maximum_block_size = Number(readline.question(`How big should be the maximum block size? [${res.props.maximum_block_size}] : `))
  let sbd_interest_rate = Number(readline.question(`How high should be the SBD interest rate? [${res.props.sbd_interest_rate}] : `))

  if (witness_url) _g.WITNESS_URL = witness_url
  if (account_creation_fee && !isNaN(account_creation_fee)) _g.PROPS.account_creation_fee = `${account_creation_fee.toFixed(3)} STEEM`
  if (maximum_block_size && !isNaN(maximum_block_size)) _g.PROPS.maximum_block_size = maximum_block_size
  if (sbd_interest_rate >= 0 && !isNaN(sbd_interest_rate)) _g.PROPS.sbd_interest_rate = sbd_interest_rate

  console.log('\nConfiguration:\n----------------')
  console.log({ props: _g.PROPS, url: _g.WITNESS_URL, witness: WITNESS })
  let b = readline.keyInYN(`\nDo you want to update your witness now?`)
  if (!b) return
  await update_witness(_g.ORIG_KEY)
  console.log(`Update was sucessful. Exiting now.`)
}

start()