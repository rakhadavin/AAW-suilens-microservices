/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
*/

// Composables
import { VueQueryPlugin } from "@tanstack/vue-query";
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'
import './styles/tailwind.css'
import './styles/main.scss'

const app = createApp(App)

registerPlugins(app)
app.use(VueQueryPlugin);

app.mount('#app')
