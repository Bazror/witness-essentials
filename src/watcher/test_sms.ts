require('dotenv').config()
import { send_sms } from '../helpers/alert'

import * as _g from '../_g'

let test = async () => {
  _g.log('Testing SMS')
  await send_sms(`Test`, true)
  _g.log('Finished testing')
}

test()