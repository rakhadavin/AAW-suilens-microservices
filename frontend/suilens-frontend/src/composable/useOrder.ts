import { useMutation, useQueryClient } from "@tanstack/vue-query";

const API_BASE = import.meta.env.VITE_ORDER_API || "http://localhost:3002";

interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  lensId: string;
  branchCode: string;
  startDate: string;
  endDate: string;
}

export function useOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { raw };
      }

      if (!response.ok) {
        throw new Error(data.error || raw || "Failed to create order");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
