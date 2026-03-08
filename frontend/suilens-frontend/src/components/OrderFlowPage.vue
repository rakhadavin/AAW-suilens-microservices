<template>
  <div class="page">
    <div class="topbar">
      <button class="btn secondary" @click="$emit('go-home')">← Back to Home</button>
      <button class="btn secondary" @click="$emit('go-guide')">Failure Test Guide</button>
    </div>

    <div class="grid">
      <section class="card">
        <h2>Create Order</h2>
        <p class="muted">
          Pilih lensa, ambil cabang dari Inventory Service, lalu buat pesanan.
        </p>

        <div class="form-grid">
          <div class="field">
            <label>Customer Name</label>
            <input v-model="form.customerName" placeholder="System Test" />
          </div>

          <div class="field">
            <label>Customer Email</label>
            <input v-model="form.customerEmail" placeholder="test@test.com" />
          </div>

          <div class="field full">
            <label>Lens</label>
            <select v-model="form.lensId">
              <option value="">Select lens</option>
              <option v-for="lens in lenses" :key="lens.id" :value="lens.id">
                {{ lens.manufacturerName }} - {{ lens.modelName }}
              </option>
            </select>
          </div>

          <div class="field full">
            <label>Branch (from Inventory Service)</label>
            <select v-model="form.branchCode" :disabled="!form.lensId || inventoryLoading">
              <option value="">Select branch</option>
              <option
                v-for="branch in availableBranchOptions"
                :key="branch.branchCode"
                :value="branch.branchCode"
              >
                {{ branch.branchName }} ({{ branch.branchCode }}) - available:
                {{ branch.availableQuantity }}/{{ branch.totalQuantity }}
              </option>
            </select>
            <small class="help" v-if="inventoryLoading">Loading branch stock...</small>
            <small class="error" v-if="inventoryError">{{ inventoryError.message }}</small>
          </div>

          <div class="field">
            <label>Start Date</label>
            <input v-model="form.startDate" type="date" />
          </div>

          <div class="field">
            <label>End Date</label>
            <input v-model="form.endDate" type="date" />
          </div>
        </div>

        <div class="actions">
          <button class="btn primary" :disabled="createOrder.isPending.value" @click="submitOrder">
            {{ createOrder.isPending.value ? 'Submitting...' : 'Create Order' }}
          </button>

          <button
            class="btn danger"
            :disabled="!createdOrderId || cancelOrder.isPending.value"
            @click="submitCancel"
          >
            Cancel Latest Order
          </button>
        </div>

        <p v-if="actionError" class="error block">{{ actionError }}</p>
        <p v-if="actionSuccess" class="success block">{{ actionSuccess }}</p>
      </section>

      <section class="card">
        <h2>Inventory Snapshot</h2>

        <div v-if="!branches.length" class="empty">
          Pilih lensa untuk melihat stok cabang.
        </div>

        <div v-else class="branch-list">
          <div v-for="branch in branches" :key="branch.branchCode" class="branch-item">
            <div>
              <strong>{{ branch.branchName }}</strong>
              <div class="muted small">{{ branch.branchCode }} · {{ branch.address }}</div>
            </div>

            <span
              class="badge"
              :class="branch.availableQuantity > 0 ? 'badge-ok' : 'badge-empty'"
            >
              {{ branch.availableQuantity }}/{{ branch.totalQuantity }}
            </span>
          </div>
        </div>

        <hr />

        <h2>Latest Order</h2>
        <div v-if="latestOrder" class="json-box">
          <pre>{{ JSON.stringify(latestOrder, null, 2) }}</pre>
        </div>
        <div v-else class="empty">Belum ada order dibuat.</div>
      </section>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useInventory } from '../composable/useInventory'
import { useLenses } from '../composable/useLenses'
import { useOrder } from '../composable/useOrder'
import { useCancelOrder } from '../composable/useCancelOrder'

defineEmits<{
  (e: 'go-home' | 'go-guide'): void
}>()

const form = reactive({
  customerName: 'System Test',
  customerEmail: 'test@test.com',
  lensId: '',
  branchCode: '',
  startDate: '2025-03-10',
  endDate: '2025-03-12',
})

const actionError = ref('')
const actionSuccess = ref('')
const latestOrder = ref<any | null>(null)

const { data: lensesData } = useLenses()

const {
  data: inventoryData,
  isLoading: inventoryLoading,
  error: inventoryError,
  refetch,
} = useInventory(computed(() => form.lensId))

const createOrder = useOrder()
const cancelOrder = useCancelOrder()

const lenses = computed(() => lensesData.value ?? [])
const branches = computed(() => inventoryData.value?.branches ?? [])

const availableBranchOptions = computed(() =>
  branches.value.filter((branch) => branch.availableQuantity > 0)
)

const createdOrderId = computed(() => latestOrder.value?.id || '')

watch(
  () => form.lensId,
  () => {
    form.branchCode = ''
  }
)

async function submitOrder() {
  actionError.value = ''
  actionSuccess.value = ''

  try {
    const result = await createOrder.mutateAsync({ ...form })
    latestOrder.value = result
    actionSuccess.value = 'Order created successfully'

    if (form.lensId) {
      await refetch()
    }
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Failed to create order'
  }
}

async function submitCancel() {
  if (!createdOrderId.value) return

  actionError.value = ''
  actionSuccess.value = ''

  try {
    const result = await cancelOrder.mutateAsync(createdOrderId.value)
    latestOrder.value = result
    actionSuccess.value = 'Order cancelled successfully'

    if (form.lensId) {
      await refetch()
    }
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Failed to cancel order'
  }
}
</script>

<style scoped>
.page {
  display: grid;
  gap: 20px;
  color: #0f172a;
}
.topbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 20px;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
  color: #0f172a;
}
h2,
label,
strong {
  color: #0f172a;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.full {
  grid-column: 1 / -1;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
input,
select {
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  color: #0f172a;
  background: white;
}
.actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
.danger {
  background: #fee2e2;
  color: #991b1b;
}
.muted {
  color: #64748b;
}
.small {
  font-size: 12px;
}
.help {
  color: #475569;
}
.error {
  color: #b91c1c;
}
.success {
  color: #15803d;
}
.block {
  margin-top: 12px;
}
.branch-list {
  display: grid;
  gap: 10px;
}
.branch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 14px;
}
.badge {
  padding: 8px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}
.badge-ok {
  background: #dcfce7;
  color: #166534;
}
.badge-empty {
  background: #fee2e2;
  color: #991b1b;
}
.empty {
  color: #64748b;
}
.json-box {
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 14px;
  padding: 14px;
  overflow: auto;
}
pre {
  margin: 0;
  white-space: pre-wrap;
}
</style>