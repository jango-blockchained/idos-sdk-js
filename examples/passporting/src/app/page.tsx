"use client";

import { Button, CircularProgress } from "@heroui/react";
import type { idOSCredential } from "@idos-network/idos-sdk";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useTransition } from "react";
import invariant from "tiny-invariant";
import { useAccount, useSignMessage } from "wagmi";

import { invokePassportingService } from "@/actions";
import { useIdOS } from "@/idOS.provider";

const useFetchCredential = (id: string) => {
  const idOS = useIdOS();

  return useSuspenseQuery({
    queryKey: ["credential-details", id],
    queryFn: () => idOS.data.get<idOSCredential>("credentials", id, false),
  });
};

const CREDENTIAL_ID = process.env.NEXT_PUBLIC_DUMMY_CREDENTIAL_ID;

function MatchingCredential() {
  // We assume that the credential that we need has the hardcoded `id`.
  // In real life, we need to list all the credentials and find the one that we need.
  // That can be done by searching the `public_notes` field for values like `type=human` etc.
  invariant(CREDENTIAL_ID, "NEXT_PUBLIC_DUMMY_CREDENTIAL_ID is not set");
  const credential = useFetchCredential(CREDENTIAL_ID);
  const idOS = useIdOS();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isPending, startTransition] = useTransition();

  const publicNotes = Object.entries(
    JSON.parse(credential.data?.public_notes ?? "{}") as Record<string, string>,
  ).filter(([key]) => key !== "id");

  const handleCredentialDuplicateProcess = () => {
    startTransition(async () => {
      if (!credential.data) return;

      const contentHash = await idOS.data.getCredentialContentSha256Hash(credential.data.id);
      const lockedUntil = 0;

      const granteeIdentifierPublicKey = process.env.NEXT_PUBLIC_GRANTEE_IDENTIFIER_PUBLIC_KEY;
      const granteeEncryptionPublicKey = process.env.NEXT_PUBLIC_GRANTEE_ENCRYPTION_PUBLIC_KEY;

      invariant(granteeIdentifierPublicKey, "NEXT_PUBLIC_GRANTEE_IDENTIFIER_PUBLIC_KEY is not set");
      invariant(granteeEncryptionPublicKey, "NEXT_PUBLIC_GRANTEE_ENCRYPTION_PUBLIC_KEY is not set");

      const { id } = await idOS.data.shareCredential(
        credential.data.id,
        granteeEncryptionPublicKey,
        {
          granteeAddress: granteeIdentifierPublicKey,
          lockedUntil: 0,
        },
      );

      // Create the DAG payload
      const dag = {
        dag_owner_wallet_identifier: address as string,
        dag_grantee_wallet_identifier: granteeIdentifierPublicKey,
        dag_data_id: id,
        dag_locked_until: lockedUntil,
        dag_content_hash: contentHash,
      };

      // Request a message to sign that will be used in the DAG payload
      const message: string = await idOS.data.requestDAGSignature(dag);

      // Sign the message
      const signature = await signMessageAsync({ message });

      await invokePassportingService({
        ...dag,
        dag_signature: signature,
      });
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-semibold text-2xl">
        We have found a matching credential that we can reuse:
      </h3>
      <div className="flex flex-col items-stretch gap-4 rounded-md border border-neutral-700 bg-neutral-900 p-6">
        <dl className="flex flex-col items-stretch gap-4">
          {publicNotes.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 border-neutral-700 border-t pt-4 first:border-transparent first:pt-0"
            >
              <dt className="text-gray-200 text-sm capitalize">{key}</dt>
              <dd className="text-green-200 text-sm uppercase">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <p className="text-green-500 text-sm">
          In order to proceed, we need to request an encrypted duplicate of this credential.
        </p>
        <p className="text-green-500 text-sm">Click the button below to start the process:</p>
      </div>
      <Button onPress={handleCredentialDuplicateProcess} isLoading={isPending}>
        {isPending ? "Requesting credential duplicate..." : "Request credential duplicate"}
      </Button>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex h-full flex-col place-content-center items-center gap-4">
      <Suspense
        fallback={
          <div className="flex h-full flex-col place-content-center items-center gap-2">
            <CircularProgress aria-label="Searching for a matching credential..." />
            <p>Seaching for a matching credential...</p>
          </div>
        }
      >
        <MatchingCredential />
      </Suspense>
    </div>
  );
}
