import {
  createDynamicClient,
  initializeClient,
} from "@dynamic-labs-sdk/client";
import { addEvmExtension } from "@dynamic-labs-sdk/evm";

const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

export const dynamicClient = environmentId
  ? createDynamicClient({
      autoInitialize: false,
      environmentId,
      metadata: {
        name: "Mainnet Ready",
        universalLink:
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      },
    })
  : null;

if (dynamicClient) {
  addEvmExtension();
  void initializeClient();
}
