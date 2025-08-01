"use client";
import { Transak } from "@transak/transak-sdk";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { useBuyStore } from "@/app/dashboard/buy/store";
import { useAppStore } from "@/stores/app-store";

export function TransakProvider() {
  const { transakToken, credentialId, findTransakToken, setCurrentStep } = useAppStore();
  const { spendAmount, buyAmount, selectedCurrency, selectedToken } = useBuyStore();
  const transak = useRef<Transak | null>(null);

  useEffect(() => {
    if (credentialId && !transakToken) {
      findTransakToken(credentialId);
    }
  }, [credentialId, findTransakToken, transakToken]);

  useEffect(() => {
    if (!transak.current && transakToken) {
      console.log("Initializing Transak with token:", transakToken);
      invariant(process.env.NEXT_PUBLIC_TRANSAK_API_KEY, "TRANSAK_API_KEY is not set");

      transak.current = new Transak({
        apiKey: process.env.NEXT_PUBLIC_TRANSAK_API_KEY,
        environment: Transak.ENVIRONMENTS.STAGING,
        // @ts-ignore: types are not up to date at Transak side
        kycShareTokenProvider: "SUMSUB",
        kycShareToken: transakToken,
        defaultCryptoCurrency: selectedToken,
        defaultCryptoAmount: +buyAmount || 0,
        defaultFiatCurrency: selectedCurrency,
        defaultFiatAmount: +spendAmount || 0,
      });

      transak.current.init();

      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, (orderData) => {
        console.log("Transak widget closed:", orderData);
        transak.current?.close();
        transak.current = null;
        setCurrentStep("complete");
      });

      Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData) => {
        console.log("Transak order successful:", orderData);
        // @todo: switch to dashboard UI (show user the change)
      });

      Transak.on(Transak.EVENTS.TRANSAK_ORDER_FAILED, (orderData) => {
        console.log("Transak order failed:", orderData);
      });
    }
  }, [transakToken, setCurrentStep, selectedToken, buyAmount, selectedCurrency, spendAmount]);

  // Cleanup Transak on unmount
  useEffect(() => {
    return () => {
      if (transak.current) {
        transak.current.close();
        transak.current = null;
      }
    };
  }, []);

  return null;
}
