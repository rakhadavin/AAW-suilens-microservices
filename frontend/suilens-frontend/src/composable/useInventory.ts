import { computed, type Ref } from "vue";
import { useQuery } from "@tanstack/vue-query";

const API_BASE = import.meta.env.VITE_INVENTORY_API || "http://localhost:3004";

export interface InventoryBranch {
  branchCode: string;
  branchName: string;
  address: string;
  availableQuantity: number;
  totalQuantity: number;
}

interface InventoryResponse {
  lensId: string;
  branches: InventoryBranch[];
}

export function useInventory(lensId: Ref<string>) {
  return useQuery<InventoryResponse>({
    queryKey: computed(() => ["inventory", lensId.value]),
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/inventory/lenses/${lensId.value}`);

      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }

      return response.json();
    },
    enabled: computed(() => !!lensId.value),
    staleTime: 1000 * 10,
  });
}
