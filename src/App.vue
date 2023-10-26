<script>

import LogIn from "@/components/LogIn.vue";
import Dashboard from "@/components/Dashboard.vue";

export default {
  data() {
    return {
      hasLoggedIn: false,
    }
  },
  components: {
    Dashboard,
    LogIn,
  },
}
</script>

<template>
  <main>
    <log-in v-if="!hasLoggedIn" @login="hasLoggedIn = true"></log-in>
    <dashboard v-else></dashboard>
    </main>
</template>

<style lang="scss">
</style>
