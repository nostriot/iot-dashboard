<script>
import CloseIcon from "@/components/icons/CloseIcon.vue";

export default {
  name: "Settings",
  components: {CloseIcon},
  data() {
    return {
      isSettingsSaved: false,
      // field values to populate from local storage
      nsec: null,
      npub: null,
      relay: null,
    }
  },
  methods: {
    saveSettings() {
      // save settings to local storage
      localStorage.setItem('nsec', this.nsec)
      localStorage.setItem('npub', this.npub)
      localStorage.setItem('relay', this.relay)
      // go to /dashboard
      this.isSettingsSaved = true
    }
  },
  // on mount load settings from local storage
  mounted() {
    // if local storage is empty, use default values
    if (!localStorage.getItem('nsec')) {
      localStorage.setItem('nsec', 'nsec13yf4m2xenfyhy63pq2mxv0yznh3ekt4zn9wh8de3cp78fp0vxh9qz9rmal')
    }
    if (!localStorage.getItem('npub')) {
      localStorage.setItem('npub', 'npub16zlujj75xf8hmu48vqwyzaeqnq5qglzd8yzdvsqf50r8ldw4ul9qvgf7m6')
    }
    if (!localStorage.getItem('relay')) {
      localStorage.setItem('relay', 'wss://relay.nostriot.com')
    }


    this.nsec = localStorage.getItem('nsec')
    this.npub = localStorage.getItem('npub')
    this.relay = localStorage.getItem('relay')
  }
}
</script>

<template>
  <div class="settings">
    <div class="settings__header">
      <h1>Settings</h1>
      <router-link to="/dashboard" class="back">
        <close-icon/>
      </router-link>
    </div>
    <div v-if="isSettingsSaved" class="settings__message">
      <p>Settings saved!</p>
    </div>
    <div class="settings__content">
      <form action="" @submit.prevent="saveSettings()">
<!--        <fieldset>-->
<!--          <label for="nsec">Your nsec</label>-->
<!--          <input type="text" name="nsec" id="nsec" v-model="nsec" placeholder="nsec..." />-->
<!--        </fieldset>-->
<!--        <fieldset>-->
<!--          <label for="npub">Your device's npub</label>-->
<!--          <input type="text" name="npub" id="npub" v-model="npub" placeholder="npub..." />-->
<!--        </fieldset>-->
        <fieldset>
          <label for="relay">Your prefered relay</label>
          <input type="text" name="relay" id="relay" placeholder="wss://nos.lol" v-model="relay" />
        </fieldset>

        <button>Save</button>
      </form>
    </div>
  </div>
</template>

<style lang="scss">
.settings {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.6);

  form {
    fieldset {
      border: 0;
      padding: 0 0 10px;
      // center contents
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    label {
      width: 100%;
      display: block;
      text-align: left;

    }

    input[type="text"] {
      padding: 8px 4px;
      border-radius: 4px;
      border: 1px solid #999;
      width: 100%;
    }

    // submit button
    button {
      margin-top: 20px;
      width: 100%;
      height: 50px;
      border-radius: 5px;
      border: 0;
      background-color: black;
      color: white;
      font-size: 1rem;
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
      text-align: center;
      font-size: 1.2rem;
      font-weight: bold;
    }

    .back {
      position: absolute;
      top: 1rem;
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
    padding: 1rem;
  }

  &__message {
    padding: 0.5rem 1rem;
    background-color: #F3E8FF;

    p {
      font-size: 1rem;
    }
  }
}
</style>
