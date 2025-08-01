import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import { getNearFullAccessPublicKeys, signNearMessage } from "@idos-network/core";
import { useSignal } from "@preact/signals";
import { defineStepper } from "@stepperize/react";
import { TokenNEAR } from "@web3icons/react";
import { useEffect } from "preact/hooks";
import { connectedWalletType, message, walletPayload } from "../state";
import { Button } from "./ui/button";

const { useStepper } = defineStepper(
  {
    id: "connect",
    title: "Connect your wallet",
    description: "Connect the wallet you want to add to your idOS profile",
  },
  {
    id: "sign-message",
    title: "Sign a message",
    description: "Sign a message with your wallet to prove you own it",
  },
);

const selector = await setupWalletSelector({
  network: import.meta.env.DEV ? "testnet" : "mainnet",
  modules: [setupMeteorWallet(), setupHereWallet()],
});

const modal = setupModal(selector, {
  contractId: "",
  methodNames: [],
});

export function NearConnector() {
  const stepper = useStepper();
  const isSignedIn = useSignal(false);
  const accountId = useSignal<string>("");

  useEffect(() => {
    if (isSignedIn.value && stepper.isFirst) {
      connectedWalletType.value = "near";
      stepper.next();
    }
  }, [isSignedIn.value, stepper]);

  useEffect(() => {
    const subscription = selector.store.observable.subscribe(() => {
      isSignedIn.value = selector.isSignedIn();
      console.log(isSignedIn.value);
      accountId.value = selector.store.getState().accounts[0].accountId || "";

      // Handle external disconnections
      if (!selector.isSignedIn() && connectedWalletType.value === "near") {
        connectedWalletType.value = null;
        accountId.value = "";
        stepper.reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [stepper, accountId, isSignedIn]);

  const handleSignMessage = async () => {
    const wallet = await selector.wallet();
    const signature = await signNearMessage(wallet, message);

    if (signature) {
      walletPayload.value = {
        address: accountId.value,
        signature,
        public_key: (await getNearFullAccessPublicKeys(accountId.value)) || [],
        message,
        disconnect: disconnectNear,
      };
    }
  };

  const disconnectNear = async () => {
    const wallet = await selector.wallet();
    await wallet.signOut();
  };

  const handleDisconnect = async () => {
    await disconnectNear();
    connectedWalletType.value = null;
    accountId.value = "";
    stepper.reset();
  };

  return (
    <div class="flex max-w-xl flex-col gap-2">
      {stepper.when("connect", () => (
        <div class="flex flex-col gap-4">
          <Button onClick={() => modal.show()}>
            Connect with NEAR
            <TokenNEAR variant="mono" size={24} />
          </Button>
        </div>
      ))}
      {stepper.when("sign-message", (step) => (
        <div class="flex flex-col gap-4">
          <h1 class="text-center font-bold text-2xl">{step.title}</h1>
          <p class="text-center text-neutral-400 text-sm">{step.description}</p>
          <div class="flex flex-col gap-2">
            <p class="text-center text-neutral-400 text-sm">Connected as:</p>
            <p class="text-center text-neutral-400 text-sm">{accountId}</p>
          </div>
          <Button onClick={handleSignMessage}>Sign a message</Button>
          <Button onClick={handleDisconnect}>Disconnect</Button>
        </div>
      ))}
    </div>
  );
}
