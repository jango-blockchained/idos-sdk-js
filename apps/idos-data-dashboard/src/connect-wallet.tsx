import { Box, Button, Heading, Image, Link, Text, VStack } from "@chakra-ui/react";
import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import * as GemWallet from "@gemwallet/api";
import { getGemWalletPublicKey } from "@idos-network/core";
import { StrKey } from "@stellar/stellar-base";
import { TokenIcon } from "@web3icons/react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect } from "react";
import invariant from "tiny-invariant";
import { useAccount } from "wagmi";
import { useWalletSelector } from "@/core/near";
import stellarKit from "./core/stellar-kit";
import { useWalletStore } from "./stores/wallet";

const derivePublicKey = async (address: string) => {
  invariant(address, "Address is required");
  return Buffer.from(StrKey.decodeEd25519PublicKey(address)).toString("hex");
};

export const ConnectWallet = () => {
  const { open } = useWeb3Modal();
  const { modal } = useWalletSelector();
  const { address, isConnected: evmConnected } = useAccount();
  const { setWalletType, setWalletAddress, setWalletPublicKey } = useWalletStore();
  const { accountId } = useWalletSelector();

  const connectStellarWallet = async () => {
    await stellarKit.openModal({
      onWalletSelected: async (option: ISupportedWallet) => {
        stellarKit.setWallet(option.id);
        const { address } = await stellarKit.getAddress();
        const publicKey = await derivePublicKey(address);
        setWalletAddress(address);
        setWalletPublicKey(publicKey);
        setWalletType("Stellar");
      },
    });
  };

  useEffect(() => {
    if (evmConnected) {
      setWalletType("evm");
      setWalletAddress(address ?? null);
      setWalletPublicKey(address ?? null);
    }
  }, [evmConnected, address, setWalletType, setWalletAddress, setWalletPublicKey]);

  useEffect(() => {
    if (accountId) {
      setWalletType("near");
      setWalletAddress(accountId ?? null);
      setWalletPublicKey(accountId ?? null);
    }
  }, [accountId, setWalletType, setWalletAddress, setWalletPublicKey]);

  return (
    <Box
      gap={0}
      h="100dvh"
      background="url('/cubes.png') center center repeat"
      backgroundSize="cover"
    >
      <VStack
        pos="fixed"
        insetY={0}
        right={0}
        align={{
          base: "stretch",
          md: "center",
        }}
        w={{
          base: "100%",
          lg: 728,
        }}
        h="100dvh"
        p={5}
        bg="neutral.900"
      >
        <VStack
          align={{
            base: "stretch",
            md: "center",
          }}
          placeContent="center"
          gap={5}
          flex={1}
        >
          <Image
            src="/idos-dashboard-logo.svg"
            alt="idOS Dashboard logo"
            w="200px"
            h="80px"
            mx="auto"
            loading="eager"
          />

          <Heading as="h1" size="md" fontWeight="normal" textAlign="center">
            Manage your data and grants effortlessly with the idOS Dashboard.
          </Heading>

          <Heading size="sm" fontWeight="normal" textAlign="center">
            Connect your wallet to get started.
          </Heading>

          <VStack
            align="stretch"
            minW={{
              base: "360",
              lg: 400,
            }}
            gap={3}
          >
            <Button size="lg" justifyContent="space-between" onClick={() => open()}>
              Connect a wallet
              <Image alt="NEAR logo" src="/wallet-connect.svg" w={8} h={8} mr={1} />
            </Button>
            <Button size="lg" justifyContent="space-between" onClick={() => modal.show()}>
              Connect with NEAR
              <Image alt="NEAR logo" src="/near.svg" w={10} h={10} />
            </Button>
            <Button
              size="lg"
              justifyContent="space-between"
              onClick={() => {
                GemWallet.isInstalled().then((res) => {
                  if (res.result.isInstalled) {
                    getGemWalletPublicKey(GemWallet).then((publicKey) => {
                      invariant(publicKey, "Public key is required");
                      setWalletType("xrpl");
                      setWalletAddress(publicKey.address ?? null);
                      setWalletPublicKey(publicKey.publicKey ?? null);
                    });
                  } else {
                    alert("Please install GemWallet to connect with XRP");
                    window.open(
                      "https://chromewebstore.google.com/detail/gemwallet/egebedonbdapoieedfcfkofloclfghab?hl=en",
                      "_blank",
                    );
                  }
                });
              }}
            >
              Connect with XRP
              <Image alt="XRP logo" src="/xrp.svg" w={10} h={10} />
            </Button>
            <Button size="lg" justifyContent="space-between" onClick={connectStellarWallet}>
              Connect with Stellar
              <Box display="flex" alignItems="center" mr={1}>
                <TokenIcon symbol="xlm" size={34} />
              </Box>
            </Button>
          </VStack>
        </VStack>
        <VStack>
          <Text
            display="flex"
            gap={2}
            alignItems="center"
            placeContent="center"
            fontSize="small"
            fontWeight="semibold"
          >
            <Text as="span">POWERED BY</Text>
            <Image src="/idos-logo.svg" alt="idOS logo" w={68} h="auto" />
          </Text>
        </VStack>
      </VStack>
      <Link
        isExternal
        href="https://drive.google.com/file/d/1CypYsXx--xCT05cjEbYE4TCT9ymF698r/view?usp=drive_link"
        target="_blank"
        pos="fixed"
        right={5}
        bottom={5}
        color="green.200"
        display="inline-flex"
        alignItems="center"
        gap={2}
        fontSize="sm"
        textUnderlineOffset={4}
        _hover={{ color: "green.400", textDecoration: "underline" }}
      >
        Privacy Policy
      </Link>
    </Box>
  );
};
