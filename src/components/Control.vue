<script>
export default {
  name: "Control",
  props: {
    controlTitle: {
      type: String,
      required: true,
    },
    controlValue: {
      type: Number,
      required: true,
    },
    controlType: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      required: false,
      default: '',
    },
  },
  data() {
    return {
      newControlValue: 0,
    }
  },
  mounted() {
    this.newControlValue = this.controlValue
  },
  methods: {
    sendSetting() {
      this.$emit('updatecontrol', this.newControlValue)
    }
  },
  // emit
  emits: ['updatecontrol'],
}
</script>

<template>
  <div class="control-card">
    <p>{{ controlTitle }}</p>
    <p v-if="controlType == 'switch'">{{ controlValue == 1 ? 'On' : 'Off'}}</p>
    <p v-else>{{ controlValue }}{{ unit }}</p>
    <div class="control-card__settings">
      <p>Set</p>
      <div v-if="controlType == 'increment'">
        <p>
          <button @click="++newControlValue">+</button>
          <button @click="--newControlValue">-</button>
        </p>
        <p>{{ newControlValue }}</p>
        <p>
          <button @click="sendSetting()">Set</button>
        </p>
      </div>
      <div v-else-if="controlType == 'switch'">
        <p>
          <button @click="newControlValue = (newControlValue ? 0 : 1);sendSetting()">
            {{ newControlValue == 1 ? 'Off' : 'On'}}
          </button>
        </p>
      </div>
      <div v-else>
        <p>Please specific a controlType prop</p>
      </div>
    </div>
  </div>
</template>

<style>

</style>