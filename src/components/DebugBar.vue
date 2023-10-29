<script>
export default {
  name: "DebugBar",
  props: {
    // debug messages object
    debugMessages: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      sortedDebugMessages: {},
    }
  },
  methods: {
    // handle debug messages change
    handleDebugMessagesChange() {
      // sort by key reversed
      this.sortedDebugMessages = Object.keys(this.debugMessages)
        .sort()
        .reverse()
        .reduce((obj, key) => {
          obj[key] = this.debugMessages[key]
          return obj
        }, {})

    }
  },
  watch: {
    // debugmessages deep watch
    debugMessages: {
      handler: 'handleDebugMessagesChange',
      deep: true,
    },
  },
}
</script>

<template>
  <div class="debug-bar" ref="debugBar">
    <ul>
      <!--        key in {} and then message -->
      <li v-for="(message, key) in sortedDebugMessages" :key="key">
        {{key}}: {{message}}
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.debug-bar {
  width: 100vw;
  background-color: white;
  padding: 2rem;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
  font-family: monospace;
  color: green;

  ul {
    border-top: 1px solid #999;
  }

  ul, li {
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      margin-bottom: 5px;
      border-bottom: 1px solid #999;
      padding: 1rem 0;
    }
  }
}
</style>