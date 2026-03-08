<template>
  <div class="app-shell">
    <header class="header">
      <div>
        <h1>SuiLens Frontend</h1>
        <p>Microservices demo for catalog, inventory, orders, and compensation flow</p>
      </div>
    </header>

    <main class="container">
      <HomePage
        v-if="page === 'home'"
        @go-order="page = 'order'"
        @go-guide="page = 'guide'"
      />

      <OrderFlowPage
        v-else-if="page === 'order'"
        @go-home="page = 'home'"
        @go-guide="page = 'guide'"
      />

      <FailureGuidePage
        v-else
        @go-home="page = 'home'"
        @go-order="page = 'order'"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HomePage from './components/HomePage.vue'
import OrderFlowPage from './components/OrderFlowPage.vue'
import FailureGuidePage from './components/FailureGuidePage.vue'

const page = ref<'home' | 'order' | 'guide'>('home')
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}
.header {
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.9);
}
.header > div {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}
</style>