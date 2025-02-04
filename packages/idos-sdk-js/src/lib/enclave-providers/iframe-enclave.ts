import { EnclaveProvider, StoredData } from "./enclave-provider";

export class IframeEnclave extends EnclaveProvider {
  hostUrl = new URL(import.meta.env.VITE_IDOS_ENCLAVE_URL);

  container: string;
  iframe: HTMLIFrameElement;
  usePasskeys?: string;

  constructor(options: { container: string; usePasskeys?: boolean }) {
    super();
    this.container = options.container;
    this.iframe = document.createElement("iframe");
    this.usePasskeys = options.usePasskeys ? "webauthn" : undefined;
  }

  async load(): Promise<StoredData> {
    await this.#loadEnclave();

    return (await this.#requestToEnclave({ storage: {} })) as StoredData;
  }

  async init(humanId?: string, signerAddress?: string, signerPublicKey?: string): Promise<Uint8Array> {
    let { encryptionPublicKey } = (await this.#requestToEnclave({
      storage: { humanId, signerAddress, signerPublicKey },
    })) as { encryptionPublicKey: Uint8Array };

    if (encryptionPublicKey) return encryptionPublicKey;

    this.#showEnclave();

    return this.#requestToEnclave({ keys: { usePasskeys: this.usePasskeys } }).then((encryptionPublicKey) => {
      this.#hideEnclave();
      return encryptionPublicKey as Uint8Array;
    });
  }

  async store(key: string, value: string): Promise<string> {
    return this.#requestToEnclave({ storage: { [key]: value } }) as Promise<string>;
  }

  async reset(): Promise<void> {
    this.#requestToEnclave({ reset: {} });
  }

  async confirm(message: string): Promise<boolean> {
    this.#showEnclave();

    return this.#requestToEnclave({ confirm: { message } }).then((response) => {
      this.#hideEnclave();
      return response as boolean;
    });
  }

  async encrypt(message: Uint8Array, receiverPublicKey: Uint8Array): Promise<Uint8Array> {
    return this.#requestToEnclave({ encrypt: { message, receiverPublicKey } }) as Promise<Uint8Array>;
  }

  async decrypt(message: Uint8Array, senderPublicKey: Uint8Array): Promise<Uint8Array> {
    return this.#requestToEnclave({ decrypt: { fullMessage: message, senderPublicKey } }) as Promise<Uint8Array>;
  }

  async #loadEnclave() {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy#directives
    const permissionsPolicies = ["publickey-credentials-get", "storage-access"];

    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox
    const liftedSandboxRestrictions = [
      "forms",
      "modals",
      "popups",
      "popups-to-escape-sandbox",
      "same-origin",
      "scripts",
    ].map((toLift) => `allow-${toLift}`);

    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#referrerpolicy
    const referrerPolicy = "origin";

    const styles = {
      "aspect-ratio": "4/1",
      "background-color": "transparent",
      border: "none",
      display: "block",
      width: "100%",
    };

    this.iframe.allow = permissionsPolicies.join("; ");
    this.iframe.referrerPolicy = referrerPolicy;
    this.iframe.sandbox.add(...liftedSandboxRestrictions);
    this.iframe.src = this.hostUrl.toString();
    for (const [k, v] of Object.entries(styles)) {
      this.iframe.style.setProperty(k, v);
    }

    const container = document.querySelector(this.container);
    if (!container) throw new Error(`Can't find container with selector ${this.container}`);

    container.appendChild(this.iframe);

    return new Promise((resolve) => this.iframe.addEventListener("load", resolve));
  }

  #showEnclave() {
    this.iframe.parentElement!.classList.add("visible");
  }

  #hideEnclave() {
    this.iframe.parentElement!.classList.remove("visible");
  }

  async #requestToEnclave(request: any) {
    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();

      port1.onmessage = ({ data }) => {
        port1.close();
        data.error ? reject(data.error) : resolve(data.result);
      };

      this.iframe.contentWindow!.postMessage(request, this.hostUrl.origin, [port2]);
    });
  }
}
