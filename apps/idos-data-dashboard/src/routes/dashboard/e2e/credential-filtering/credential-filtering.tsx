import { Button, ButtonGroup, Heading, HStack, Stack, VStack } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { sepolia } from "viem/chains";
import { useSwitchChain } from "wagmi";

import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";

const useShareMatchingCredential = () => {
  return useMutation({
    mutationFn: () => Promise.resolve(), // @todo: re-implement this with new Grants update
    // sdk.grants.shareMatchingEntry(
    //   "credentials",
    //   {
    //     level: "human",
    //     type: "human",
    //   },
    //   {
    //     pick: {
    //       "credentialSubject.id": "uuid:33ce045b-19f8-4f5a-89d9-4575f66f4d40",
    //     },
    //     omit: {},
    //   },
    //   address as string,
    //   0,
    //   "zleIscgvb3usjyVqR4OweNM2oXwmzADJVO3g7byuGk8=",
    // ),
  });
};

export function Component() {
  const share = useShareMatchingCredential();
  const { switchChainAsync } = useSwitchChain();

  const onShare = async () => {
    await share.mutateAsync();
  };

  return (
    <VStack align="stretch" flex={1} gap={2.5}>
      <HStack
        justifyContent="space-between"
        h={{
          base: 14,
          lg: 20,
        }}
        p={5}
        bg="neutral.900"
        rounded="xl"
      >
        <Heading
          as="h1"
          fontSize={{
            base: "x-large",
            lg: "xx-large",
          }}
        >
          Share a matching credential
        </Heading>
        <ButtonGroup>
          <Button
            id="switch-chain-button"
            onClick={async () =>
              await switchChainAsync({
                chainId: sepolia.id,
              })
            }
          >
            Switch network
          </Button>
          <Button id="share-matching-credential-button" onClick={onShare}>
            Share
          </Button>
        </ButtonGroup>
      </HStack>
      {share.isPending ? <DataLoading /> : null}
      {share.isError ? (
        <DataError
          onRetry={async () => {
            await share.mutateAsync();
          }}
        />
      ) : null}
      {share.isSuccess ? (
        <Stack id="transaction" gap={14} p={5} bg="neutral.900" rounded="xl">
          {/* @todo: Add transaction ID to the UI */}
          {/* <Text id="transaction-id">Transaction ID: {share.data.transactionId}</Text> */}
        </Stack>
      ) : null}
    </VStack>
  );
}
Component.displayName = "e2e_CredentialFiltering";
