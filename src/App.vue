<script setup>
import NostrSwitch from "@/components/NostrSwitch.vue";
import ZapStreamVideo from "@/components/ZapStreamVideo.vue";
</script>

<template>
  <main>
    <h1>NIP-91 Actuator PoC</h1>
    <p>Send a NIP-91 8000 event and move the Ostwich's head</p>
    <zap-stream-video></zap-stream-video>
    <p>Then</p>
    <nostr-switch></nostr-switch>
    <p>
      <a href="https://nostriot.com">nostriot.com</a>
    </p>
  </main>
</template>

<style>
main {
  width: 500px;
  margin: 0 auto;
}

h1, p {
  text-align: center;
}
</style>
