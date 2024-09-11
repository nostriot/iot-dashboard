<script>
import Loading from "@/components/icons/Loading.vue";

export default {
  name: "LogIn",
  components: {Loading},
  data() {
    return {
      showLoading: false,
    }
  },
  methods: {
    login() {
      this.showLoading = true
      setTimeout(() => {
        this.$emit('login')
        // go to /dashboard
        this.$router.push('/dashboard')
      }, 600)
    }
  },
  emits: ['login'],
}
</script>

<template>
<div class="login">
  <button @click="login" >
    <span v-if="!showLoading">Log in</span>
    <loading v-else></loading>
  </button>
  <p class="login__subtitle">"The everything app of freedom"</p>
</div>
</template>

<style lang="scss">
.login {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #333;

  &__subtitle {
    font-size: 0.8rem;
    font-style: italic;
    margin-top: 100px;
  }

  img {
    width: 100px;
    height: 100px;
    margin-bottom: 20px;
  }

  input, button {
    margin: 10px;
    height: 50px;
    border-radius: 5px;
    border: none;
    width: 250px;
    font-size: 18px;
  }

  button {
    font-weight: bold;
    background-color: #9806C6;
    color: white;
  }

}
</style>
