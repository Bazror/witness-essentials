const _g = require('../_g')
import * as readline from 'readline-sync'
import * as CryptoJS from 'crypto-js'

import { get_account, key_valid } from '../helpers/steem'

let { WITNESS } = _g.config

export let initiate_active_key_cryptographie = async () => {
  try {
    let account:any = await get_account(WITNESS)
    if (!process.env.ENCRYPTED_ACTIVE_KEY) {
      console.log('\n' + '----------------------------' + '\n')
      console.log(`Welcome to Wolf's Witness `)
      console.log(`The first step is to encrypt your private active-key. Afterwards, please copy the encrypted key and paste it into your .env.`)
      console.log(`\nInfo: The module that is used for this dialogue, does not support the backspace-key aka. the deletion of password (hidden) characters. Either restart the script or press enter to re-enter your encryption-key in case of mistyping.\n`)
      console.log('\n' + '----------------------------' + '\n')
      let active_valid = false
      let active_key = ''
      while (!active_valid) {
        active_key = readline.question(`Please enter your private active-key: `, { hideEchoBack: true })
        active_valid = key_valid(active_key, account.active.key_auths)
      }

      let encrypted = false
      while (!encrypted) {
        let encryption_key = readline.question(`Please enter your encryption key: `, { hideEchoBack: true })
        let confirmation = readline.question(`Please confirm your encryption key: `, { hideEchoBack: true })
        if (encryption_key === confirmation) {
          console.log(`The encryption will take a few seconds.`)
          //let 
          //let decrypted = decrypt(encrypted, '123')
          encrypted = encrypt(active_key, encryption_key)
          console.log(`Success. Here is your encrypted active-key`)
          console.log('\n' + '----------------------------' + '\n')
          console.log(`ENCRYPTED_ACTIVE_KEY=${encrypted}`)
          console.log('\n' + '----------------------------' + '\n')
          console.log('Please paste it into your .env and then restart this script.')
          process.exit(0)
        }
      }
    } else {
      let active_valid = false
      let active_key = ''
      while (!active_valid) {
        let encryption_key = readline.question(`Please enter your encryption key: `, { hideEchoBack: true })
        console.log(`The decryption will take a few seconds.`)
        active_key = decrypt(process.env.ENCRYPTED_ACTIVE_KEY, encryption_key)
        active_valid = key_valid(active_key, account.active.key_auths)
        if (active_valid) {
          _g.ACTIVE_KEY = active_key
        } else {
          console.log(`Invalid encryption-key. If you've forgotten your key, then please delete ENCRYPTED_ACTIVE_KEY in your .env\n`)
        }
      }
    }
  } catch (error) {
    console.error(error.message)
    await initiate_active_key_cryptographie()
  }

}

export let encrypt = (password, key) => {
  try {
    let params = { keySize: 512 / 32, iterations: 100000 }
    key = CryptoJS.PBKDF2(key, 'salt', params).toString()
    password = CryptoJS.AES.encrypt(password, key).toString()
    return password
  } catch (e) {
    console.error(e)
    return false
  }
}

export let decrypt = (password, key) => {
  try {
    let params = { keySize: 512 / 32, iterations: 100000 }
    let encrypted_password = CryptoJS.PBKDF2(key, 'salt', params).toString()
    password = CryptoJS.AES.decrypt(password, encrypted_password)
    if (password) password = password.toString(CryptoJS.enc.Utf8)
    if (!key) {
      return false
    }
    return password
  } catch (e) {
    console.error(e)
    return false
  }
}

