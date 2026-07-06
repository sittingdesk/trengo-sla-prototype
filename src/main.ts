// App entry point.
// Creates the Vue app, loads the global styles (design tokens + Tailwind),
// and mounts everything into <div id="app">.
// Note: no router or state library yet — this is the empty foundation shell.
// We'll add them when real pages need navigation or shared state.
import { createApp } from 'vue'
import App from './App.vue'
// Inter — the design.md §2 typeface, self-hosted (weights 400/500/600/700).
// Latin subset only, so the single-file build stays small + offline-capable.
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import './assets/index.css'

createApp(App).mount('#app')
