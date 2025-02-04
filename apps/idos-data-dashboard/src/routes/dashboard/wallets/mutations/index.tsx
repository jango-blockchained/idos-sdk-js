import { idOS } from "#/lib/idos";
import { createMutation } from "react-query-kit";

export const useDeleteWallet = createMutation({
  mutationFn: async ({ id }: { id: string }) => {
    return idOS.data.delete("wallets", id);
  }
});

export const useAddWallet = createMutation({
  mutationFn: ({ address }: { address: string }) => {
    return idOS.data.create("wallets", { address, signature: "", message: "" });
  }
});
