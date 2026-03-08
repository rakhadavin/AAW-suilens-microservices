<template>
  <div class="page">
    <div class="topbar">
      <button class="btn secondary" @click="$emit('go-home')">← Back to Home</button>
      <button class="btn primary" @click="$emit('go-order')">Go to Create Order</button>
    </div>

    <section class="card">
      <h2>Failure Scenario & Event Monitoring Guide</h2>
      <p class="muted">
        Halaman ini membantu pengujian requirement R3, idempotency, dan monitoring aliran event.
      </p>

      <div class="steps">
        <div class="step">
          <h3>1. Stop Inventory Service</h3>
          <pre>docker compose stop inventory-service</pre>
        </div>

        <div class="step">
          <h3>2. Create Order</h3>
          <p>Buat pesanan dari halaman Create Order saat inventory consumer sedang down.</p>
        </div>

        <div class="step">
          <h3>3. Cancel Order</h3>
          <p>Batalkan order lalu nyalakan lagi inventory service untuk cek rekonsiliasi.</p>
        </div>

        <div class="step">
          <h3>4. Start Inventory Service Again</h3>
          <pre>docker compose start inventory-service</pre>
        </div>

        <div class="step">
          <h3>5. Monitor Real-Time Event Flow</h3>
          <pre>docker compose logs -f order-service inventory-service notification-service rabbitmq</pre>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'go-home'): void
  (e: 'go-order'): void
}>()
</script>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}
.topbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
}
.steps {
  display: grid;
  gap: 14px;
}
.step {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
}
pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 12px;
  overflow: auto;
}
.muted {
  color: #64748b;
}
.btn {
  border: 0;
  border-radius: 12px;
  padding: 12px 18px;
  font-weight: 600;
  cursor: pointer;
}
.primary {
  background: #111827;
  color: white;
}
.secondary {
  background: #eef2ff;
  color: #3730a3;
}
</style>