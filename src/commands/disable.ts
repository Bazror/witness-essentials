require('dotenv').config()

const _g = require('../_g')

import * as commands from './commands'

export let start = async () => {
  await commands.cmd_update_key(_g.NULL_KEY)
}

start()