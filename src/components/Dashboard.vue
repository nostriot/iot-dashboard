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
import BatteryControl from "@/components/BatteryControl.vue";
import DebugBar from "@/components/DebugBar.vue";

export default {
  components: {
    DebugBar,
    BatteryControl,
    Control
  },
  data() {
    return {
      isDebugBarVisible: false,
      // relayMessages as keyed array
      relayMessages: {},
      hasInternetConnection: false,
      splashMessage: "",
      privateKey: "89135da8d99a49726a2102b6663c829de39b2ea2995d73b731c07c7485ec35ca",
      publicKey: "d58d5dc2abdef2195532b0940d56bc44c693b48084bf11d0bb70035510c9e6b5",
      receiverPublicKey: "22defd21ef1187806b54033e9d657d4430d98efaebd1289bb24b82224b80c7b4",
      buttonEnabled: false,
      temperatureValue: 0,
      lightValue: 0,
      mostRecentTemperatureTimestamp: 0,
      mostRecentLightTimestamp: 0,
      relay: null // or you can initialize with relayInit('wss://nos.lol') if you want it immediately
    }
  },
  methods: {
    addDebugMessage(message) {
      // push to array with timestamp as array key
      this.relayMessages[Date.now()] = message
    },
    reload() {
      window.location.reload()
    },
    onOffline() {
      this.hasInternetConnection = false
      // kill the relay connection
      this.relay = null
    },
    onOnline() {
      this.hasInternetConnection = true
      // connect to relay
      this.init()
    },
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
      let ciphertext = await nip04.encrypt(this.privateKey, this.receiverPublicKey, contentString)

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
      // broadcast it
      const signedEvent = finishEvent(event, this.privateKey)
      console.log(signedEvent)
      await this.relay.publish(signedEvent)
      console.log('published')
      this.addDebugMessage("Published event: " + JSON.stringify(event))

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
        this.addDebugMessage(`connected to ${this.relay.url}`)
        this.buttonEnabled = true
        this.getIntentEvents()
      })
      this.relay.on('error', () => {
        console.log(`failed to connect to ${this.relay.url}`)
        this.addDebugMessage(`failed to connect to ${this.relay.url}`)
      })

      await this.relay.connect()
    },
    async getIntentEvents() {
      // now request the last X events
      this.addDebugMessage('subscribing to events')
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
          if (event.created_at > this.mostRecentLightTimestamp) {
            this.lightValue = contentObj.value
            this.mostRecentLightTimestamp = event.created_at
            this.addDebugMessage("Received event content: " + content)
          }
        } else if (contentObj.name.toLowerCase() === 'temperature') {
          if (event.created_at > this.mostRecentTemperatureTimestamp) {
            this.temperatureValue = contentObj.value
            this.mostRecentTemperatureTimestamp = event.created_at
            this.addDebugMessage("Received event content: " + content)
          }
        }
      })
    },
    isRelayConnected() {
      // console.log(this.relay && this.relay.status)
      if (!this.relay) {
        return false
      }
      //  0 is connecting
      //  1 is open
      //  2 is closing
      //  3 is closed
      if (this.relay.status === 1) {
        return true
      } else {
        return false
      }
    },
    pingRelayStatus() {
      // every 5 seconds, refresh the relay status
      let status = this.isRelayConnected()
      console.log('Is relay connected?', status)

      setTimeout(() => {
        this.pingRelayStatus()
      }, 5000)
    }
  },
  computed: {},
  mounted() {
    this.init()
    this.hasInternetConnection = navigator.onLine
    this.pingRelayStatus()
  },
  created() {
    window.addEventListener('offline', this.onOffline)
    window.addEventListener('online', this.onOnline)
  },
  destroyed() {
    window.removeEventListener('offline', this.onOffline)
    window.removeEventListener('online', this.onOnline)
  },

}
</script>

<template>
  <div class="dashboard">
    <div class="dashboard__header">
      <h1>My Devices</h1>
      <p class="dashboard__header__add-button">+</p>
    </div>
    <div class="dashboard__content" v-if="hasInternetConnection">
      <div class="dashboard__content__header">
        <div
            :class="`dashboard__content__header__circle ${isRelayConnected() ? 'dashboard__content__header__circle--active' : 'dashboard__content__header__circle--inactive'}`">
        </div>
        <h2>Living Room</h2>
      </div>

      <p v-if="!isRelayConnected()" class="dashboard__reload-bar">
        Not connected to relay.
        <button @click="reload()">
          Reload
        </button>
      </p>

      <div v-if="splashMessage" class="dashboard__splash">
        <p>{{ splashMessage }}</p>
      </div>
      <div class="dashboard__cards">
        <control :controlValue="temperatureValue" controlType="increment"
                 :is-interactive="isRelayConnected()"
                 control-title="Temperature"
                 unit="°C"
                 @updatecontrol="handleSettingChange('temperature', $event)"
        />
        <control :controlValue="lightValue" controlType="switch"
                 :is-interactive="isRelayConnected()"
                 control-title="Light"
                 @updatecontrol="handleSettingChange('light', $event)"
        />
        <battery-control
            :is-interactive="isRelayConnected()"
        />
      </div>
    </div>
    <div class="dashboard__content dashboard__content--no-internet" v-else>
      <h1>:(</h1>
      <p>No Internet connection found.</p>
      <p>Please connect to the Internet and try again.</p>
    </div>
    <!--        show debug button -->
    <p :class="`dashboard__debug-bar__toggle-button ${isDebugBarVisible ? 'dashboard__debug-bar__toggle-button--visible' : ''}`" @click="isDebugBarVisible = !isDebugBarVisible">
      Debug
      <span v-if="isDebugBarVisible">V</span>
      <span v-else>^</span>
    </p>
    <debug-bar :debug-messages="relayMessages"
               :class="`dashboard__debug-bar ${isDebugBarVisible ? 'dashboard__debug-bar--visible' : ''}`"/>
  </div>
</template>

<style lang="scss">
.dashboard {
  background-color: rgba(255, 255, 255, 0.6);
  height: 100vh;

  &__debug-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    overflow-x: hidden;
    word-wrap: break-word;
    display: none;

    // is visible
    &--visible {
      height: 25%;
      display: block;
    }

    &__toggle-button {
      position: absolute;
      bottom: 10px;
      left: 10px;
      color: black;
      padding: 5px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 0.8rem;

      &--visible {
        bottom: 25%;
      }
    }
  }

  &__reload-bar {
    margin-top: 10px;

    button {
      background-color: white;
      border: 1px solid white;
      border-radius: 5px;
      padding: 4px;
    }
  }

  &__header {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #fff;
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
    }
  }

  &__content {
    position: relative;
    padding: 1rem;

    &--no-internet {
      margin-top: 50px;
      text-align: center;
      font-size: 1rem;
      color: #666;

      h1 {
        font-weight: bold;
        font-size: 3rem;
      }

      p {
        font-weight: 500;
      }
    }

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
        background-color: red;
        margin-right: 10px;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.7);
        margin-bottom: 3px;

        &--active {
          background-color: lightgreen;
        }
      }
    }
  }

  // splash message, fixed under header
  &__splash {
    position: fixed;
    top: 64px;
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
    position: relative;
  }
}
</style>
