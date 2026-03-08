import { useMutation } from '@tanstack/vue-query'

const API_BASE = import.meta.env.VITE_ORDER_API || 'http://localhost:3002'

export function useCancelOrder() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(
        `${API_BASE}/api/orders/${orderId}/cancel`,
        {
          method: 'PATCH',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel order')
      }

      return response.json()
    },
  })
}