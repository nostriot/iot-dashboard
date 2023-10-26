<script>
import Thermostat from "@/components/icons/Thermostat.vue";
import Switch from "@/components/icons/SwitchIcon.vue";
import SwitchIcon from "@/components/icons/SwitchIcon.vue";
import OnOff from "@/components/icons/OnOff.vue";
import Battery from "@/components/icons/Battery.vue";
import Loading from "@/components/icons/Loading.vue";

export default {
  name: "BatteryControl",
  components: {Loading, Battery},
  data() {
    return {
      controlValue: 25,
      isWaiting: false,
    }
  },
  methods: {
    refreshBatteryLevel() {
      // show loading...
      this.isWaiting = true
      // delay of 500ms to simulate a network request
      setTimeout(() => {
        // reduce battery level by a number
        let reduceBy = Math.floor(Math.random() * 3) + 1
        this.controlValue = this.controlValue - reduceBy
        if (this.controlValue < 0) {
          this.controlValue = 0
        }
        this.isWaiting = false
      }, 500)
    },
    getBatteryCssClass() {
      // between 15 and 20 is medium
      if (this.controlValue < 20 && this.controlValue > 10) {
        return 'battery-medium'
      }
      if (this.controlValue <= 10) {
        return 'battery-low'
      }
      return 'battery-ok'
    }
  },
  // emit
  emits: ['updatecontrol'],
  watch: {
    controlValue: function (val) {
      this.newControlValue = val
    }
  }
}
</script>

<template>
  <div class="control-card">
    <div class="control-card__icon control-card__icon--battery">
      <p>
        <battery/>
      </p>
      <p>
        Battery Level
      </p>

    </div>
    <div class="control-card__value">
      <p :class="getBatteryCssClass()" v-if="!isWaiting">
        {{ controlValue }}%
      </p>
      <p v-else class="control-card__value__loading">
        <loading/>
      </p>
      <button class="control-card__value__battery-refresh-button" @click="refreshBatteryLevel()">
        <p>
          Refresh
        </p>
      </button>
    </div>
  </div>
</template>
<style lang="scss">
.control-card__value {
  p {
    margin-bottom: 0;
  }

  &__loading {
    margin-right: 15px;
  }
}

.control-card__value__battery-refresh-button {
  position: absolute;
  top: 60px;
  right: 0;
  border: 0;
  background-color: #9806C6;
  color: white;
  border-radius: 5px;
  font-size: 1rem;
  padding: 6px 10px;
}

.battery {
  &-ok {
    color: green;
  }

  &-medium {
    color: orange;
  }

  &-low {
    color: red;
  }
}

.spinner_V8m1 {
  margin-right: 15px !important;

  circle {
    stroke: #be88d2 !important;
  }
}
</style>