import {
  binaryWriteUint16BE,
  borshSerialize,
  bytesConcat,
  sha256Hash,
  utf8Decode,
} from "@idos-network/utils/codecs";
import type { KeyPair } from "near-api-js";

export function kwilNep413Signer(
  recipient: string,
): (keyPair: KeyPair) => (messageBytes: Uint8Array) => Promise<Uint8Array> {
  return (keyPair: KeyPair) =>
    async (messageBytes: Uint8Array): Promise<Uint8Array> => {
      const message = utf8Decode(messageBytes);
      const nonceLength = 32;
      const nonce = crypto.getRandomValues(new Uint8Array(nonceLength));

      const nep413BorschSchema = {
        struct: {
          message: "string",
          nonce: { array: { type: "u8", len: nonceLength } },
          recipient: "string",
          callbackUrl: { option: "string" },
        },
      } as const;

      const tag = 2147484061; // 2**31 + 413

      const { signature } = keyPair.sign(
        sha256Hash(
          bytesConcat(
            borshSerialize("u32", tag),
            borshSerialize(nep413BorschSchema, { message, nonce, recipient }),
          ),
        ),
      );

      const kwilNep413BorschSchema = {
        struct: {
          tag: "u32",
          ...nep413BorschSchema.struct,
        },
      };

      const kwilNep413BorshParams = {
        tag,
        message,
        nonce,
        recipient,
      };

      const kwilNep413BorshPayload = borshSerialize(kwilNep413BorschSchema, kwilNep413BorshParams);

      return bytesConcat(
        binaryWriteUint16BE(kwilNep413BorshPayload.length),
        kwilNep413BorshPayload,
        signature,
      );
    };
}
