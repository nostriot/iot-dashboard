import './assets/main.css'

import { createApp } from 'vue'
import {createRouter, createWebHashHistory  } from "vue-router";
import App from './App.vue'
import Dashboard from "@/components/Dashboard.vue";
import Settings from "@/components/Settings.vue";
import LogIn from "@/components/LogIn.vue";

const routes = [
    { path: '/', component: LogIn },
    { path: '/dashboard', component: Dashboard},
    { path: '/settings', component:  Settings },
]

// define routes
const router = createRouter({
    // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
    history: createWebHashHistory(),
    routes, // short for `routes: routes`
})

const app = createApp(App)
app.use(router)

app.mount('#app')
