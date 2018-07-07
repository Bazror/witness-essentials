require('dotenv').config()
import { send_email } from '../helpers/alert'

import * as _g from '../_g'

let test = async () => {
  _g.log('Testing Email')
  await send_email(`Test`, true)
  _g.log('Finished testing')
}

test()