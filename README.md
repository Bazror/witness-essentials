# Witness Essentials

Essential tools & scripts for STEEM-Witnesses.

- Witness Watcher incl. failover option, rotation between multiple signing keys and notifications via EMAIL, TELEGRAM & SMS.
- Pricefeed
- Remote Control via Telegram.
- Commands for quickly updating witness parameters or changing signing-keys / disabling the witness.
- Encryption support for active-key (doesn't work with PM2, but with multiplexers - e.g. tmux)

# Updates
- <a href="https://steemit.com/witness/@therealwolf/witness-essentials-110---remote-control-your-witness-via-telegram">1.1.0 - Remote Control & Notifications via Telegram (Notice: Old configs are deprecated and packages were added!)</a>
- <a href="https://steemit.com/utopian-io/@therealwolf/witness-essentials-1-0-2-commands-and-dynamic-properties">1.0.2 - Commands & Dynamic Properties</a>
- <a href="https://steemit.com/utopian-io/@therealwolf/witness-essentials-1-0-1-pricefeed-bug-fix-poloniex-added-and-witness-watcher-test">1.0.1 - Ready for Appbase, Pricefeed Bug Fix, Poloniex Added & Witness-Watcher Test</a>
- <a href="https://steemit.com/witness/@therealwolf/wolf-s-witness-essentials">1.0.0 - Initial Release</a>

# Witness Watcher

Script that watches for missed blocks of your witness. In case of a missed block, the witness signing-key gets changed to either fall back to another server, disable the witness or to rotate between keys.

### Features

- Keys can be rotated for a number of rounds or endlessly. For example, if you have 3 different servers, if all of them fail after another, instead of disabling the witness, the first server gets chosen again - until the number of rounds have been reached, in that case the witness would be finally disabled.

- You can enable alerts for missed blocks via TELEGRAM, SMS (NEXMO & TWILIO) and EMAIL (GMAIL).

- RPC-Failover

- [Good-To-Know] Disabling of the witness wasn't possible for many months due to a bug in the steem-js and dsteem node-modules. After @netuoso created a PR, which solved this problem - @drakos made me aware of this fix and I created a npm-module called `steem-js-witness-fix`, which supports disabling of the witness. For now, `Witness Essentials` will use that plugin until it gets implemented in the official steem-js release.

# Pricefeed

Script that gets the current STEEM-price of major exchanges and publishes the pricefeed for your witness.

### Features

- Active-Key can be saved in an encrypted format instead of plaintext inside .env (doesn't work with PM2, but with multiplexers - e.g. tmux)

- 5 major exchanges supported - Bittrex, Binance, Huobi, Upbit, Poloniex.


- RPC-Failover

# Remote Control via Telegram

Have you ever wanted a way to quickly switch signing-keys or disable your witness, without needing to be at your computer?

That's now possible with Remote Control via Telegram.

### Features

- /enable <key> - This command will enable a specific key
- /nextkey - This command will rotate through your specified signing keys
- /disable - This command will disable your witness
- /confirm <password> - This command is needed to confirm all others commands with your password
- /help - Get all available commands and your USER/CHAT-ID.

# Commands

You're also able to update your witness parameters & keys easily through npm commands.

## Update

### `npm run update`

```
Please enter your encryption key: **************
The decryption will take a few seconds.

What should be your witness URL? [https://steemit.com/witness/@therealwolf/making-steem-greater-therealwolf-is-now-a-witness] :
How much do you want the account creation fee to be? (number only - without STEEM) [0.200 STEEM] : 0.1
How big should be your maximum block size? [65536] :
How high should be the SBD interest rate? [1] : 0

Configuration:
----------------
{ props:
   { account_creation_fee: '0.100 STEEM',
     maximum_block_size: 65536,
     sbd_interest_rate: 0 },
  url: 'https://steemit.com/witness/@therealwolf/making-steem-greater-therealwolf-is-now-a-witness',
  witness: 'therealwolf' }

Do you want to update your witness now? [y/n]: y
2018-07-14T12:10:54.526Z - Updated Witness to STM62KKbXf2igpDV7SfwwQEdFoxfTc2sp9t72FgaEWxPZ6VysqYdT
Update was sucessful. Exiting now.
```

## Enable key

### `npm run enable <key>`

```
npm run enable STM62KKbXf2igpDV7SfwwQEdFoxfTc2sp9t72FgaEWxPZ6VysqYdT

Please enter your encryption key: ****
The decryption will take a few seconds.
2018-07-14T11:37:18.572Z - Updated Witness to STM62KKbXf2igpDV7SfwwQEdFoxfTc2sp9t72FgaEWxPZ6VysqYdT
Update was sucessful. Exiting now.
```



## Disable Witness

### `npm run disable`

```
npm run disable

Please enter your encryption key: ****
The decryption will take a few seconds.
2018-07-14T11:42:03.549Z - Disabled Witness
```

---

## Info

Everything has been tested, but I'm taking no responsibilities for any bugs. Please review the source-code yourself.

---

## How-To

There are two different config-files but all scripts use the same .env file.

### Setup

First off, make sure you have npm/yarn & node installed. Then:

1.) Clone Repository
```
git clone https://github.com/therealwolf42/witness-essentials.git
cd witness-essentials
```
2.) Install dependencies

```
yarn / npm i
```

3.) Copy configs from examples (copy pricefeed config only if you're using the pricefeed)

```
cp configs/config.example.json configs/config.json
cp configs/config.pricefeed.example.json configs/config.pricefeed.json
```

4.) Edit config.json

```
nano configs/config.json
```

If you're not sure what the fields are for, take a look at the `configs_schema` folder.

```
{
  "RPC_NODES": [
    "https://api.steemit.com",
    "https://api.steemitstage.com",
    "https://steemd.privex.io",
    "https://gtg.steem.house:8090",
    "https://rpc.buildteam.io",
    "https://steemd.minnowsupportproject.org"
  ],
  "WITNESS": "",
  "TEST_MODE": false,
  "ENABLE_ENCRYPTION": false,
  "SIGNING_KEYS": [
     // ADD ALL(!) OF YOUR SIGNING-KEYS HERE. Even the one you're currently using
    "STM7..."
  ],
  "INTERVAL": 10,
  "MISSED_BLOCKS_THRESHOLD": 1,
  "ROTATE_KEYS": true,
  "ROTATE_ROUNDS": 1,
  "PROPS": {
    "account_creation_fee": "0.100 STEEM",
    "maximum_block_size": 65536,
    "sbd_interest_rate": 0
  },
  "ALERT_METHODS": [
    "EMAIL", "SMS", "TELEGRAM"
  ],
  "SMS_PROVIDER": "nexmo",
  "EMAIL_TO": "",
  "EMAIL_FROM": "",
  "ALERT_AFTER_EVERY_MISSED": true
}
```

5.) Edit pricefeed config (If you're using the pricefeed)

```
{
  "EXCHANGES": [
    "bittrex",
    "binance",
    "huboi",
    "upbit",
    "poloniex"
  ],
  "PEG": 1,
  "INTERVAL": 60
}
```

6.) Create an .env file (`touch .env`) with the following variables, but without the comments.

```
API_KEY= // API Key for NEXMO or TWILIO
API_SECRET= // API Secret for NEXMO or TWILIO
PHONE_NUMBER= // Incl. country-code: e.g. 49123456789 (+49 would be Germany) - required for both NEXMO and TWILIO
FROM_NUMBER= // Only required for TWILIO
ACTIVE_KEY= // Only required if you don't want to use the encryption feature
ENCRYPTED_ACTIVE_KEY= // You will get an encrypted key after you started either Witness Watcher or Pricefeed for the first time
GOOGLE_MAIL_ACCOUNT= // Email Account where emails are getting send from - required if you want to use Email Alerts with GMAIL
GOOGLE_MAIL_PASSWORD= // Same as above
TELEGRAM_BOT_TOKEN=// The token you'll get from botfather
TELEGRAM_PASSWORD=// The password which will confirm your commands through telegram
TELEGRAM_USER_ID=// You'll get the ID once you've created your bot and pressed on start or entered /help
```

## Starting

### Witness Watcher

```
yarn run watcher
```

Or with PM2 (keep in mind that encryption doesn't work with PM2 due to the missing functionality for readline)

```
pm2 start npm --name=watcher -- run watcher
pm2 save
pm2 logs watcher
```

### Remote Control

```
yarn run remote
```

Or with PM2 (keep in mind that encryption doesn't work with PM2 due to the missing functionality for readline)

```
pm2 start npm --name=remote -- run remote
pm2 save
pm2 logs remote
```

### Pricefeed

```
yarn run pricefeed
```

Or with PM2 (keep in mind that encryption doesn't work with PM2 due to the missing functionality for readline)

```
pm2 start npm --name=pricefeed -- run pricefeed
pm2 save
pm2 logs pricefeed
```

### Update Witness

```
yarn run update
```

### Enable Key

```
yarn run enable <key>
```

### Disable Witness

```
yarn run disable
```

### Test SMS

```
yarn run test_sms
```

### Test EMAIL

```
yarn run test_email
```

### Test Witness

```
yarn run test_witness
```

## Questions or Feedback?

Contact me on steem.chat `@therealwolf` or on discord `therealwolf#2442`

## No Support & No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
