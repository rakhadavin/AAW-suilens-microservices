<template>
  <div class="app-shell">
    <header class="header">
      <div class="header-inner">
        <h1 class="eyebrow">SuiLens Frontend</h1>
        <p class="subtitle">
          Microservices demo for catalog, inventory, orders, and compensation flow
        </p>
      </div>
    </header>

    <main class="container">
      <div class="content-wrap">
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
      </div>
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
  color: #0f172a;
}

.header {
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 20px 24px;
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 30px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6366f1;
}

.subtitle {
  margin: 0;
  color: #475569;
  font-size: 16px;
  line-height: 1.5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.content-wrap {
  min-height: 300px;
  color: #0f172a;
}
</style>