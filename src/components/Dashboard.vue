<script>
import {ref, onMounted} from 'vue'
import {
  relayInit,
  finishEvent,
  validateEvent,
  verifySignature,
  getSignature,
  getEventHash,
  getPublicKey,
  nip04
} from 'nostr-tools'
import {secp256k1} from '@noble/curves/secp256k1'

import Control from "@/components/Control.vue";

export default {
  components: {
    Control
  },
  data() {
    return {
      splashMessage: "",
      privateKey: "89135da8d99a49726a2102b6663c829de39b2ea2995d73b731c07c7485ec35ca",
      publicKey: "d58d5dc2abdef2195532b0940d56bc44c693b48084bf11d0bb70035510c9e6b5",
      receiverPublicKey: "22defd21ef1187806b54033e9d657d4430d98efaebd1289bb24b82224b80c7b4",
      buttonEnabled: false,
      temperatureValue: 0,
      lightValue: 0,
      relay: null // or you can initialize with relayInit('wss://nos.lol') if you want it immediately
    }
  },
  methods: {
    /**
     * method for setting a splash message and clearing after 3 seconds
     */
    setSplashMessage(message) {
      this.splashMessage = message
      setTimeout(() => {
        this.splashMessage = ""
      }, 3000)
    },

    /**
     * Constructs an 8000 intent event with encrypted JSON content
     * @returns {Promise<void>}
     */
    async handleSettingChange(name, value) {
      // content JSON
      let content = {
        "name": name,
        "value": value
      }
      // serialise it
      let contentString = JSON.stringify(content)
      // now construct the event
      let key = secp256k1.getSharedSecret(this.privateKey, "02" + this.receiverPublicKey)
      console.log('key', key)
      let ciphertext = await nip04.encrypt(this.privateKey, this.receiverPublicKey, contentString)
      console.log('ciphertext', ciphertext)

      let event = {
        pubkey: this.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 8000,
        tags: [['p', this.receiverPublicKey]],
        content: ciphertext,
      }

      event.id = getEventHash(event)
      event.sig = getSignature(event, this.privateKey)
      let ok = validateEvent(event)
      let veryOk = verifySignature(event)
      console.log("valid event", ok, veryOk)
      // broadcast it
      const signedEvent = finishEvent(event, this.privateKey)
      console.log(signedEvent)
      await this.relay.publish(signedEvent)
      console.log('published')

      let displayValue = value
      if (name.toLowerCase() === 'temperature') {
        displayValue = `set to ${value}°C`
      } else if (name.toLowerCase() === 'light') {
        displayValue = "turned " + (value ? "on" : "off")
      }

      // uc first letter of name
      let displayName = name.charAt(0).toUpperCase() + name.slice(1)

      this.setSplashMessage(`${displayName} has been ${displayValue}.`)

    },
    async init() {
      this.relay = relayInit('wss://nos.lol')
      this.relay.on('connect', () => {
        console.log(`connected to ${this.relay.url}`)
        this.buttonEnabled = true
        this.getIntentEvents()
      })
      this.relay.on('error', () => {
        console.log(`failed to connect to ${this.relay.url}`)
      })

      await this.relay.connect()
    },
    async getIntentEvents() {
      // now request the last X events
      let sub = await this.relay.sub([
        {
          kinds: [8000],
          // authors: [this.receiverPublicKey],
          limit: 10
        },
      ])
      sub.on('event', async (event) => {
        let content = await nip04.decrypt(this.privateKey, this.receiverPublicKey, event.content)
        console.log('decrypted content', content)
        let contentObj = JSON.parse(content)
        if (contentObj.name.toLowerCase() === 'light') {
          this.lightValue = contentObj.value
        } else if (contentObj.name.toLowerCase() === 'temperature') {
          this.temperatureValue = contentObj.value
        }
      })
    }
  },
  mounted() {
    this.init()
  }
}
</script>

<template>
  <div class="dashboard">
    <div class="dashboard__header">
      <h1>My Devices</h1>
      <p class="dashboard__header__add-button">+</p>
    </div>
    <div class="dashboard__content">
      <div class="dashboard__content__header">
        <div class="dashboard__content__header__circle"></div>
        <h2>Living Room</h2>
      </div>
      <div v-if="splashMessage" class="dashboard__splash">
        <p>{{ splashMessage }}</p>
      </div>
      <div class="dashboard__cards">
        <control :controlValue="temperatureValue" controlType="increment"
                 control-title="Temperature"
                 unit="°C"
                 @updatecontrol="handleSettingChange('temperature', $event)"
        />
        <control :controlValue="lightValue" controlType="switch"
                 control-title="Light"
                 @updatecontrol="handleSettingChange('light', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.dashboard {
  background-color: rgba(255, 255, 255, 0.6);
  height: 100vh;

  &__header {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #fff;
    margin-bottom: 10px;
    padding-top: 40px;
    position: relative;

    h1 {
      font-size: 1.2rem;
      color: white;
      font-weight: bold;
    }

    &__add-button {
      font-size: 2.2rem;
      color: white;
      cursor: pointer;
      position: absolute;
      right: 1rem;
      top: 1.6rem;
    }
  }

  &__content {
    position: relative;
    padding: 0 1rem;

    &__header {
      color: white;
      font-size: 0.8rem;
      font-weight: bold;
      display: flex;
      align-items: center;

      &__circle {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: lightgreen;
        margin-right: 10px;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.7);
        margin-bottom: 3px;
      }
    }
  }

  // splash message, fixed under header
  &__splash {
    position: fixed;
    top: 86px;
    left: 0;
    right: 0;
    padding: 1rem;
    background-color: rgba(255, 255, 255, 0.6);
    text-align: center;

    p {
      color: #666666;
      font-weight: 600;
      font-size: 1rem;
    }
  }

  &__cards {
    width: 100%;
  }
}
</style>
