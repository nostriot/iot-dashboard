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
  nip04,
  nip19,
} from 'nostr-tools'
import {secp256k1} from '@noble/curves/secp256k1'
import { bech32 } from '@scure/base'

import Control from "@/components/Control.vue";
import BatteryControl from "@/components/BatteryControl.vue";
import DebugBar from "@/components/DebugBar.vue";
import SettingsIcon from "@/components/icons/SettingsIcon.vue";

export default {
  components: {
    SettingsIcon,
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
      privateKey: null,
      publicKey: null,
      receiverPublicKey: null,
      relay: null,
      relayStatus: 0,
      buttonEnabled: false,
      temperatureValue: 0,
      temperatureTimestamp: 0,
      pressureValue: 0,
      pressureTimestamp: 0,
      lightValue: 0,
      mostRecentTemperatureTimestamp: 0,
      mostRecentPressureTimestamp: 0,
      mostRecentLightTimestamp: 0,
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
    hasSettings() {
      return this.privateKey && this.publicKey && this.receiverPublicKey && this.relay
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
      // settings from localSettings
      // privateKey, publicKey, receiverPublicKey and relay
      let nsec = localStorage.getItem('nsec')
      this.privateKey = nip19.decode(nsec).data;
      this.publicKey = getPublicKey(this.privateKey)
      let npub = localStorage.getItem('npub')
      this.receiverPublicKey = nip19.decode(npub).data;
      this.relay = localStorage.getItem('relay')

      // get relay from localstorage or default to nos.lol
      const relayUri = this.relay || 'wss://nos.lol'
      console.log('connecting to relay', relayUri)
      this.relay = relayInit(relayUri)
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
          kinds: [30107],
          authors: [
              'd0bfc94bd4324f7df2a7601c4177209828047c4d3904d64009a3c67fb5d5e7ca', // pressure
              '0987d97ee78e6a2281d2f45aedebc3d22da346a064850ca85440c2dd104badd4'
          ],
          limit: 10
        },
      ])
      sub.on('event', async (event) => {
        console.log('Got event', event)

        let typeTag = event.tags.find(tag => tag[0] === 'type')
        console.log('typeTag', typeTag)

        if (typeTag[1] === 'temperature') {
          if (event.created_at > this.mostRecentTemperatureTimestamp) {
            this.temperatureValue = event.content
            this.temperatureTimestamp = event.created_at
            this.mostRecentTemperatureTimestamp = event.created_at
            this.addDebugMessage("Temperature: " + event.content)
          }
        } else if (typeTag[1] === 'pressure') {
          if(event.created_at > this.mostRecentPressureTimestamp) {
            this.pressureValue = event.content
            this.pressureTimestamp = event.created_at
            this.mostRecentPressureTimestamp = event.created_at
            this.addDebugMessage("Pressure event: " + event.content)
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
      if (Number(this.relay.status) === 1) {
        this.relayStatus = 1
        return true
      } else {
        return false
      }
    },
    pingRelayStatus() {
      // every 5 seconds, refresh the relay status
      let status = this.isRelayConnected()
      // console.log('Is relay connected?', status)

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
      <router-link :to="'settings'" class="dashboard__header__settings-button">
        <SettingsIcon/>
      </router-link>
    </div>

    <div class="dashboard__content" v-if="hasInternetConnection && hasSettings()">
      <div class="dashboard__content__header">
        <div
            :class="`dashboard__content__header__circle ${isRelayConnected() ? 'dashboard__content__header__circle--active' : 'dashboard__content__header__circle--inactive'}`">
        </div>
        <p v-if="isRelayConnected()">Connected to relay</p>
        <p v-else>Not connected to relay</p>
        <p v-if="!isRelayConnected()">
          <button @click="reload()">
            Reload
          </button>
        </p>
      </div>

      <div v-if="splashMessage" class="dashboard__splash">
        <p>{{ splashMessage }}</p>
      </div>
      <div class="dashboard__cards">
        <control :controlValue="temperatureValue" controlType="increment"
                 :control-updated-timestamp="temperatureTimestamp"
                 :is-interactive="isRelayConnected()"
                 control-title="Temperature"
                 unit="°C"
                 @updatecontrol="handleSettingChange('temperature', $event)"
        />
        <control :controlValue="pressureValue" controlType="increment"
                 :control-updated-timestamp="pressureTimestamp"
                 :is-interactive="isRelayConnected()"
                 control-title="Pressure"
                 unit="hPa"
                 @updatecontrol="handleSettingChange('temperature', $event)"
        />
      </div>
    </div>
    <div class="dashboard__content dashboard__content--no-internet" v-else>
      <div v-if="hasSettings()">
      <h1>:(</h1>
      <p>No Internet connection found.</p>
      <p>Please connect to the Internet and try again.</p>
      </div>
      <div v-else>
        <h1>Welcome :)</h1>
        <p>Please open the settings page and enter your Nostr IoT settings.</p>
      </div>
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
      font-weight: bold;
    }

    &__settings-button {
      width: 24px;
      height: 24px;
      cursor: pointer;
      position: absolute;
      right: 1rem;

      svg {
        width: 24px;
        height: 24px;

        path {
        }
      }
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
