# Wolf's Witness Essentials

Essentials scripts & commands for STEEM Witnesses - written in Typescript.

# Witness Watcher

Script that watches for missed blocks of your witness. In case of a missed block, the witness signing-key gets changed to either fall back to another server or to disable the witness.

### Features

- Active-Key can be saved in an encrypted format instead of plaintext inside .env (doesn't work with PM2, but with multiplexers - e.g. tmux)

- Keys can be rotated for a number of rounds or endlessly. For example, if you have 3 different servers, if all of them fail after another, instead of disabling the witness, the first server gets chosen again - until the number of rounds have been reached, in that case the witness would be finally disabled.

- You can enable alerts for missed blocks via SMS (NEXMO & TWILIO) and EMAIL (GMAIL).

- RPC-Failover

- [Good-To-Know] Disabling of the witness wasn't possible for many months due to a bug in the steem-js and dsteem node-modules. After @netuoso created a PR, which solved this problem - @drakos made me aware of this fix and I created a npm-module called `steem-js-witness-fix`, which supports disabling of the witness. For now, `Witness Essentials` will use that plugin until it gets implemented in the official steem-js release.

# Pricefeed

Script that gets the current STEEM-price of major exchanges and publishes the pricefeed for your witness.

### Features

- Active-Key can be saved in an encrypted format instead of plaintext inside .env (doesn't work with PM2, but with multiplexers - e.g. tmux)

- 4 major exchanges supported - Bittrex, Binance, Huobi, Upbit.

- RPC-Failover

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

All scripts & commands use the same config-files.

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

3.) Copy config.json from config.example.json

```
cp config.example.json config.json
```

4.) Edit config.json

```
nano config.json
```

You will get notified if any required fields are missing when running the scripts.

```
{
  "RPC_NODES": [
    "https://api.steemit.com",
    "https://steemd.privex.io",
    "https://gtg.steem.house:8090",
    "https://rpc.buildteam.io",
    "https://steemd.minnowsupportproject.org"
  ],
  "WITNESS": "", // add your witness account-name here
  "TEST_MODE": false, // changing this to true, will result in no witness-update changes or alerts
  "ENABLE_ENCRYPTION": false, // Encryption doesn't work with PM2. Use tmux for that.
  "EXCHANGES": [
    "bittrex",
    "binance",
    "huboi",
    "upbit",
    "poloniex"
  ],
  "PEG": 1,
  "INTERVAL_FEED": 60,
  "INTERVAL_WATCHER": 10,
  "BACKUP_KEYS": [ // add your backup-keys here - e.g. "5JZ52MJF...","6TSF24FS..."
  ],
  "MISSED_BLOCKS_THRESHOLD": 1,
  "USE_SMS_ALERT": true,
  "SMS_PROVIDER": "nexmo|twilio", // choose nexmo or twilio
  "USE_EMAIL_ALERT":true,
  "EMAIL_TO":"",
  "EMAIL_FROM":"",
  "ALERT_AFTER_EVERY_MISSED": true,
  "ROTATE_KEYS": false, // rotate between your current signing & backup-keys
  "ROTATE_ROUNDS": 1 // -1 is endless,
  "PROPS": {
    "account_creation_fee": "0.100 STEEM",
    "maximum_block_size": 65536,
    "sbd_interest_rate": 0
  }
}
```

5.) Create an .env file (`touch .env`) with the following variables, but without the comments.

```
API_KEY= // API Key for NEXMO or TWILIO
API_SECRET= // API Secret for NEXMO or TWILIO
PHONE_NUMBER= // Incl. country-code: e.g. 49123456789 (+49 would be Germany) - required for both NEXMO and TWILIO
FROM_NUMBER= // Only required for TWILIO
ACTIVE_KEY= // Only required if you don't want to use the encryption feature
ENCRYPTED_ACTIVE_KEY= // You will get an encrypted key after you started either Witness Watcher or Pricefeed for the first time
GOOGLE_MAIL_ACCOUNT= // Email Account where emails are getting send from - required if you want to use Email Alerts with GMAIL
GOOGLE_MAIL_PASSWORD= // Same as above
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
