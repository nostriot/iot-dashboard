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
    <h2>{{ controlTitle }}</h2>
    <div class="control-card__value">
      <p v-if="controlType == 'switch'">{{ controlValue == 1 ? 'On' : 'Off'}}</p>
      <p v-else>{{ newControlValue }}{{ unit }}</p>
    </div>
    <div class="control-card__settings">
      <div v-if="controlType == 'increment'">
        <p>
          <button class="control-card__settings__adjust" @click="++newControlValue">+</button>
          <button class="control-card__settings__adjust" @click="--newControlValue">-</button>
        </p>
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

<style lang="scss">
.control-card {
  padding: 20px;
  margin: 15px;
  border-radius: 5px;
  text-align: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  width: 33vw;
  height: 33vw;

  &__value {
    font-size: 24px;
  }

  &__settings {
    button {
      background-color: transparent;
      border: 1px solid black;
      margin: 5px;
      border-radius: 4px;
      padding: 5px 10px;
      font-size: 22px;
    }

    &__adjust {
      width: 40px;
    }
  }
}
</style>