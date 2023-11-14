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
    <router-view/>
  </main>
</template>

<style lang="scss">
</style>
