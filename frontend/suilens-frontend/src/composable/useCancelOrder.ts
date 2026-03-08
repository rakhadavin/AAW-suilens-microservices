import { useMutation } from '@tanstack/vue-query'

const API_BASE = import.meta.env.VITE_ORDER_API || 'http://localhost:3002'

export function useCancelOrder() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
        method: "PATCH",
      });

      const raw = await response.text();

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { raw };
      }

      if (!response.ok) {
        throw new Error(data.error || raw || "Failed to cancel order");
      }

      return data;
    },
  })
}