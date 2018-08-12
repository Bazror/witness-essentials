require('dotenv').config()
const _g = require('../_g')

import * as commands from './commands'

export let start = async () => {
  let key = process.argv[2]
  commands.cmd_update_key(key)
}

start()