<script>
import Thermostat from "@/components/icons/Thermostat.vue";
import Switch from "@/components/icons/SwitchIcon.vue";
import SwitchIcon from "@/components/icons/SwitchIcon.vue";
import OnOff from "@/components/icons/OnOff.vue";

export default {
  name: "Control",
  components: {OnOff, SwitchIcon, Switch, Thermostat},
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
      settingsVisible: false,
    }
  },
  mounted() {
    this.newControlValue = this.controlValue
  },
  methods: {
    sendSetting() {
      this.settingsVisible = false
      this.$emit('updatecontrol', this.newControlValue)
    }
  },
  // emit
  emits: ['updatecontrol'],
}
</script>

<template>
  <div class="control-card">
    <div class="control-card__icon">
      <p>
        <thermostat v-if="controlType == 'increment'"/>
        <switch-icon v-else-if="controlType == 'switch'"/>
      </p>
      <p>
        {{ controlTitle }}
      </p>

    </div>
    <div class="control-card__value" @click="settingsVisible = true">
      <p v-if="controlType == 'switch'">
        <span v-if="controlValue">
        <on-off
            :is-on="newControlValue == 1 ? true : false"
            @click="newControlValue = (newControlValue ? 0 : 1);sendSetting()"
        />
        </span>
        <span v-else>
          ...
        </span>
      </p>
      <p v-else>
        <span v-if="controlValue">
          {{ controlValue }}{{ unit }}
        </span>
        <span v-else>
          ...
        </span>
      </p>
    </div>
    <div class="control-card__settings" v-if="controlType == 'increment' && settingsVisible">
      <div class="control-card__settings__value">
        {{ newControlValue }}{{ unit }}
      </div>
      <div class="control-card__settings__controls">
        <p>
          <button class="control-card__settings__adjust" @click="++newControlValue">+</button>
          <button class="control-card__settings__adjust" @click="--newControlValue">-</button>
        </p>
        <p>
          <button @click="sendSetting()"
                  class="control-card__settings__set-button"
          >Set</button>
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.control-card {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  margin-top: 20px;
  width: 100%;
  height: 130px;
  position: relative;
  color: #666666;


  &__value {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 2.4rem;

    svg {
      width: 48px;
      height: 48px;
    }
  }

  &__icon {
    position: absolute;
    top: 20px;
    left: 20px;
    text-align: left;
    font-size: 1rem;

    p {
      font-weight: 500;
    }

    svg {
      width: 48px;
      height: 48px;

      path {
        fill: #6c4285;
      }

      path, circle {
        stroke: #6c4285;
      }

      rect {
        stroke: #6c4285;
      }
    }
  }

  &__settings {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    border-radius: 10px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 1rem;

    &__value {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 3rem;

    }

    button {
      border: 1px solid #6c4285;
      margin: 5px;
      border-radius: 4px;
      padding: 5px 10px;
      font-size: 22px;
    }

    &__adjust {
      background-color: transparent;
      color: #6c4285;
      width: 40px;
    }

    &__set-button {
      width: 90px;
      background-color: #6c4285;
      border: 1px solid #6c4285;
      color: white;
    }
  }
}
</style>