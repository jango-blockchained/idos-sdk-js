import { AddProofOfPersonhood } from "#/lib/components/add-proof-of-personhood";
import { Breadcrumbs } from "#/lib/components/breadcrumbs";
import { Title } from "#/lib/components/title";
import { TitleBar } from "#/lib/components/title-bar";
import { useFetchCurrentUser } from "#/lib/queries";
import { addressAtom } from "#/lib/state";
import {
  AbsoluteCenter,
  Box,
  Button,
  Flex,
  IconButton,
  Spinner,
  Stack,
  Text,
  useDisclosure
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { isMobile } from "react-device-detect";
import { AddCredentialCard } from "./components/add-credential-card";
import { CredentialCard } from "./components/credential-card";
import { CredentialViewer } from "./components/credential-viewer";
import { DeleteCredential } from "./components/delete-credential";
import { MobileAlert } from "./components/mobile-alert";
import { Credential, useFetchCredentials } from "./queries";

export function Component() {
  const {
    isOpen: isAddProofOpen,
    onOpen: onAddProofOpen,
    onClose: onAddProofClose
  } = useDisclosure();

  const {
    isOpen: isViewCredentialOpen,
    onOpen: onCredentialViewerOpen,
    onClose: onCredentialViewerClose
  } = useDisclosure();

  const {
    isOpen: isCredentialDeleteOpen,
    onOpen: onCredentialDeleteOpen,
    onClose: onCredentialDeleteClose
  } = useDisclosure();

  const {
    isOpen: isMobileAlertOpen,
    onOpen: onMobileAlertOpen,
    onClose: onMobileAlertClose
  } = useDisclosure();

  const address = useAtomValue(addressAtom);
  const credentials = useFetchCredentials({
    enabled: !!address
  });
  const [credential, setCredential] = useState<Credential | undefined>();
  const currentUser = useFetchCurrentUser();

  const handleOpenCredentialViewer = (credential: Credential) => {
    if (isMobile) {
      onMobileAlertOpen();
      return;
    }
    setCredential(credential);
    onCredentialViewerOpen();
  };

  const handleCloseCredentialViewer = () => {
    setCredential(undefined);
    onCredentialViewerClose();
  };

  const onAddCredential = () => {
    onAddProofOpen();
  };

  const handleDeleteCredential = (credential: Credential) => {
    setCredential(credential);
    onCredentialDeleteOpen();
  };

  const handleDeleteCredentialClose = () => {
    setCredential(undefined);
    onCredentialDeleteClose();
  };

  const handleAddCredential = () => {
    if (isMobile) {
      onMobileAlertOpen();
      return;
    }

    onAddProofOpen();
  };

  if (!currentUser.data || credentials.data?.length === 0) {
    return (
      <Stack flex={1} gap={2.5} ml={[0, 0, 0, 380]}>
        <Flex align="center" justify="space-between" h={[82, 125]}>
          <Breadcrumbs items={["Dashboard", "Credentials"]} />
        </Flex>
        <Flex align="center" gap={2.5}>
          <TitleBar>
            <Title>Credentials</Title>

            <Text>
              0
              <Text as="span" mx={1} hideBelow="xl">
                Connected Credentials
              </Text>
            </Text>
          </TitleBar>
          <IconButton
            w="60px"
            h="60px"
            p={0}
            aria-label="Add wallet"
            colorScheme="green"
            hideFrom="lg"
            onClick={handleAddCredential}
            size="xl"
          >
            <PlusIcon size={24} />
          </IconButton>
          <Button
            colorScheme="green"
            hideBelow="lg"
            leftIcon={<PlusIcon size={24} />}
            onClick={handleAddCredential}
            size="xl"
          >
            Add credential
          </Button>
        </Flex>

        <AddCredentialCard onAddCredential={handleAddCredential} />
        <AddProofOfPersonhood
          isOpen={isAddProofOpen}
          onClose={onAddProofClose}
        />
        <MobileAlert
          isOpen={isMobileAlertOpen}
          onClose={onMobileAlertClose}
          content="Please use the idOS Dashboard in your desktop's browser to create new idOS credentials"
        />
      </Stack>
    );
  }

  return (
    <Box>
      <Stack flex={1} gap={2.5} ml={[0, 0, 0, 380]}>
        <Flex align="center" justify="space-between" h={[82, 125]}>
          <Breadcrumbs items={["Dashboard", "Credentials"]} />
        </Flex>
        <Flex align="center" gap={2.5}>
          <TitleBar>
            <Title>Credentials</Title>
            {currentUser.isFetching || credentials.isFetching ? (
              <Spinner size="sm" />
            ) : (
              <Text>
                {credentials.data?.length || 0}
                <Text as="span" mx={1} hideBelow="xl">
                  Connected Credentials
                </Text>
              </Text>
            )}
          </TitleBar>
          {credentials.isSuccess && !credentials.data ? (
            <Button
              colorScheme="green"
              hideBelow="lg"
              leftIcon={<PlusIcon size={24} />}
              onClick={onAddCredential}
              size="xl"
            >
              Add credential
            </Button>
          ) : null}
        </Flex>

        <Box>
          {credentials.isFetching || currentUser.isFetching ? (
            <AbsoluteCenter>
              <Spinner />
            </AbsoluteCenter>
          ) : null}

          {credentials.isSuccess ? (
            <>
              {!credentials.data ? (
                <AddCredentialCard onAddCredential={handleAddCredential} />
              ) : (
                credentials.data.map((credential) => (
                  <CredentialCard
                    key={credential.id}
                    credential={credential}
                    onViewDetails={handleOpenCredentialViewer}
                    onDelete={handleDeleteCredential}
                  />
                ))
              )}
            </>
          ) : null}
        </Box>
      </Stack>
      <AddProofOfPersonhood isOpen={isAddProofOpen} onClose={onAddProofClose} />
      {credential ? (
        <>
          <CredentialViewer
            credential={credential}
            isOpen={isViewCredentialOpen}
            onClose={handleCloseCredentialViewer}
          />
          <DeleteCredential
            isOpen={isCredentialDeleteOpen}
            credential={credential}
            onClose={handleDeleteCredentialClose}
          />
        </>
      ) : null}

      <MobileAlert
        isOpen={isMobileAlertOpen}
        onClose={onMobileAlertClose}
        content="Please use the idOS Dashboard in your desktop's browser to see
              your credential's content"
      />
    </Box>
  );
}

Component.displayname = "DashboardCredentials";
