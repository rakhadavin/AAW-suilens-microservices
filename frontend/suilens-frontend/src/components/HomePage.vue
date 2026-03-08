<template>
  <div class="page">
    <section class="hero card">
      <div class="">
        <p class="eyebrow">SuiLens Microservices</p>
        <h1>Inventory-aware order flow</h1>
        <p class="subtitle">
          Demo frontend for Catalog, Order, Inventory, and async event flow with RabbitMQ.
        </p>
      </div>

      <div class="actions">
        <button class="btn primary" @click="$emit('go-order')">Create Order</button>
        <button class="btn secondary" @click="$emit('go-guide')">Failure Test Guide</button>
      </div>
    </section>

    <section class="grid">
      <article class="card feature">
        <h3>1. Select Lens</h3>
        <p>Ambil daftar lensa dari Catalog Service lalu pilih item yang ingin dipesan.</p>
      </article>

      <article class="card feature">
        <h3>2. Select Branch</h3>
        <p>Pilih cabang dari stok Inventory Service melalui dropdown branch sederhana.</p>
      </article>

      <article class="card feature">
        <h3>3. Create / Cancel</h3>
        <p>Buat order, lalu uji compensating action melalui cancel order.</p>
      </article>

      <article class="card feature">
        <h3>4. Observe Events</h3>
        <p>Lihat aliran event real-time dengan docker compose logs.</p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'go-order'): void
  (e: 'go-guide'): void
}>()
</script>

<style scoped>

.app-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  color: #0f172a;
}

.page,
.card,
.feature,
.hero,
h1,
h2,
h3,
p {
  color: #0f172a;
}


.page {
  display: grid;
  gap: 24px;
  color: #0f172a;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.subtitle {
  color: #475569;
}
.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6366f1;
}

h1,
h3 {
  margin: 0;
  color: #0f172a;
}

.subtitle {
  margin-top: 12px;
  color: #475569;
  max-width: 760px;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
  color: #0f172a;
}

.feature h3 {
  margin-top: 0;
  margin-bottom: 8px;
}

.feature p {
  color: #475569;
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

.page {
  display: grid;
  gap: 24px;
}
.hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}
.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6366f1;
}
h1 {
  margin: 0;
  font-size: 36px;
}
.subtitle {
  margin-top: 12px;
  color: #475569;
  max-width: 760px;
}
.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
}
.feature h3 {
  margin-top: 0;
  margin-bottom: 8px;
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