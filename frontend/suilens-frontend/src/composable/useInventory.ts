import { useQuery } from '@tanstack/vue-query'

const API_BASE = import.meta.env.VITE_INVENTORY_API || 'http://localhost:3004'

export interface InventoryBranch {
  branchCode: string
  branchName: string
  address: string
  availableQuantity: number
  totalQuantity: number
}

interface InventoryResponse {
  lensId: string
  branches: InventoryBranch[]
}

export function useInventory(lensId: string) {
  return useQuery<InventoryResponse>({
    queryKey: ['inventory', lensId],

    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/api/inventory/lenses/${lensId}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }

      return response.json()
    },

    enabled: !!lensId,
    staleTime: 1000 * 10,
  })
}