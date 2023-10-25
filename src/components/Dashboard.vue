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
      temperatureValue: 21,
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

      this.setSplashMessage(`Set ${name} to ${value}.`)

    },
    async doTheThing() {
      let privateKey = "9dc30626e365978aceeb646217860477700e8ea14a09baea9e7302abb0f3d627"
      let event = {
        // kind: 8000,
        kind: 4,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: 'go',
        pubkey: getPublicKey(privateKey),
      }

      event.id = getEventHash(event)
      event.sig = getSignature(event, privateKey)

      let ok = validateEvent(event)
      let veryOk = verifySignature(event)
      // broadcast it
      const signedEvent = finishEvent(event, privateKey)
      console.log(signedEvent)
      await this.relay.publish(signedEvent)
      console.log('published')
    },
    async init() {
      this.relay = relayInit('wss://nos.lol')
      this.relay.on('connect', () => {
        console.log(`connected to ${this.relay.url}`)
        this.buttonEnabled = true
      })
      this.relay.on('error', () => {
        console.log(`failed to connect to ${this.relay.url}`)
      })

      await this.relay.connect()
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
      <h1>NostrIoT</h1>
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
</template>

<style lang="scss">
.dashboard {
  &__header {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    padding: 1rem;
    background-color: #fff;
    border-bottom: 1px solid #ccc;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    margin-bottom: 10px;

    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }
  }

  // splash message, fixed under header
  &__splash {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    padding: 1rem;
    background-color: #fff;
    border-bottom: 1px solid #ccc;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    margin-bottom: 10px;
    text-align: center;
  }
  &__cards {
    display: flex;
    flex: 1;
    width: 100%;
  }
}
</style>
