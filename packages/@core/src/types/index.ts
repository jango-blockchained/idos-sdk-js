import type { idOSCredential } from "@idos-network/credentials";
import type { Wallet as NearWallet } from "@near-wallet-selector/core";
import type { Wallet as EthersWallet, JsonRpcSigner } from "ethers";
import type { CustomKwilSigner } from "../kwil-infra";

export { KwilSigner } from "@kwilteam/kwil-js";
export type Wallet = EthersWallet | JsonRpcSigner | NearWallet | CustomKwilSigner;

export const CHAIN_TYPES = ["EVM", "NEAR"] as const;
export type ChainType = (typeof CHAIN_TYPES)[number];
export type idOSCredentialStatus = "pending" | "contacted" | "approved" | "rejected" | "expired";

export type idOSUser = {
  id: string;
  recipient_encryption_public_key: string;
};

export type idOSWallet = {
  id: string;
  user_id: string;
  address: string;
  wallet_type: string;
  message: string;
  public_key: string;
  signature: string;
};

export type idOSUserAttribute = {
  id: string;
  attribute_key: string;
  value: string;
  user_id?: string;
};

export type idOSGrant = {
  id: string;
  ag_owner_user_id: string;
  ag_grantee_wallet_identifier: string;
  data_id: string;
  locked_until: string;
  content_hash?: string;
};

export type DelegatedWriteGrant = {
  owner_wallet_identifier: string;
  grantee_wallet_identifier: string;
  issuer_public_key: string;
  id: string;
  access_grant_timelock: string;
  not_usable_before: string;
  not_usable_after: string;
};

/**
 * Following types are specific to the isle `postMessage` protocol.
 * Do not stress much about them, they will be refactored in the future once the idOS Isle is fully integrated.
 */
export type IsleTheme = "light" | "dark";

export type IsleStatus =
  | "initializing"
  | "no-profile"
  | "not-verified"
  | "pending-verification"
  | "pending-permissions"
  | "verified"
  | "not-connected"
  | "error";

export type IsleControllerMessage =
  | {
      type: "initialize";
      data: {
        theme?: IsleTheme;
      };
    }
  | {
      type: "update";
      data: {
        address?: string;
        theme?: IsleTheme;
        status?: IsleStatus;
        accessGrants?: WeakMap<
          { name: string; logo: string },
          { id: string; dataId: string; type: string }[]
        >;
      };
    }
  | {
      type: "update-create-profile-status";
      data: {
        status: "idle" | "pending" | "success" | "error";
      };
    }
  | {
      type: "update-create-dwg-status";
      data: {
        status: "idle" | "pending" | "success" | "verify-identity" | "error";
      };
    }
  | {
      type: "update-create-dwg-status";
      data: {
        status: "start-verification";
        meta: {
          url: string;
          name: string;
          logo: string;
          KYCPermissions: string[];
        };
      };
    }
  | {
      type: "update-revoke-access-grant-status";
      data: {
        status: "idle" | "pending" | "success" | "error";
      };
    }
  | {
      type: "update-request-access-grant-status";
      data: {
        status: "idle" | "pending" | "success" | "error";
      };
    }
  | {
      type: "update-request-access-grant-status";
      data: {
        status: "request-permission";
        consumer: {
          consumerAuthPublicKey: string;
          meta: {
            url: string;
            name: string;
            logo: string;
          };
        };
        KYCPermissions: string[];
      };
    }
  | {
      type: "update-view-credential-details-status";
      data: {
        status: "idle" | "pending" | "success" | "error";
        credential?: idOSCredential;
        error?: Error;
      };
    }
  | {
      type: "credential-details";
      data: {
        credential: idOSCredential;
      };
    }
  | {
      type: "toggle-animation";
      data: {
        expanded: boolean;
        noDismiss?: boolean;
      };
    };

export type IsleNodeMessage =
  | {
      type: "initialized";
      data: {
        theme: IsleTheme;
      };
    }
  | {
      type: "updated";
      data: {
        theme?: IsleTheme;
        status?: IsleStatus;
      };
    }
  | {
      type: "connect-wallet";
    }
  | {
      type: "link-wallet";
    }
  | {
      type: "create-profile";
    }
  | {
      type: "request-dwg";
    }
  | {
      type: "verify-identity";
    }
  | {
      type: "revoke-permission";
      data: {
        id: string;
      };
    }
  | {
      type: "view-credential-details";
      data: {
        id: string;
      };
    }
  | {
      type: "update-dimensions";
      data: {
        width: number;
        height: number;
      };
    };

export type IsleMessageHandler<T extends IsleNodeMessage["type"]> = (
  message: Extract<IsleNodeMessage, { type: T }>,
) => void;

export type PassportingPeer = {
  id: string;
  name: string;
  issuer_public_key: string;
  passporting_server_url_base: string;
};

export type PassportingClub = {
  id: string;
  name: string;
};
