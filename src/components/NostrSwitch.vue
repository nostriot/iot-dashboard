<script setup>
import { ref, onMounted } from 'vue'
import { relayInit, finishEvent, validateEvent, verifySignature, getSignature, getEventHash, getPublicKey } from 'nostr-tools'

// global var for button enabled state
const buttonEnabled = ref(false)

const doTheThing = async () => {
  let privateKey = "9dc30626e365978aceeb646217860477700e8ea14a09baea9e7302abb0f3d627"
  let event = {
    kind: 8000,
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
  await relay.publish(signedEvent)
  console.log('published')
}

// global var for relay
let relay

// define async function to run on mount (optional)
const init = async () => {
  // connect to relays
  relay = relayInit('wss://nos.lol')
  relay.on('connect', () => {
    console.log(`connected to ${relay.url}`)
    // now make the button enabled
    buttonEnabled.value = true
  })
  relay.on('error', () => {
    console.log(`failed to connect to ${relay.url}`)
  })


  await relay.connect()
}

// define a function to run on mount (optional)
onMounted(() => {
  init()
})
</script>

<template>
  <p><button @click="doTheThing()"
             :disabled="!buttonEnabled"
  >DOIT!</button></p>
</template>

<style scoped>

</style>