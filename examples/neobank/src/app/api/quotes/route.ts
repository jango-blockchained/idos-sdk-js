import { goTry } from "go-try";
import { type NextRequest, NextResponse } from "next/server";
import invariant from "tiny-invariant";
import type { Provider } from "@/app/types";

type NoahResponse = {
  Items: {
    PaymentMethodCategory: "Card" | "Bank";
    Rate: string;
    UpdatedAt: string;
  }[];
};

type TransakResponse = {
  response: {
    quoteId: string;
    conversionPrice: number;
    marketConversionPrice: number;
    slippage: number;
    fiatCurrency: string;
    cryptoCurrency: string;
    paymentMethod: string;
    fiatAmount: number;
    cryptoAmount: number;
    isBuyOrSell: string;
    network: string;
    feeDecimal: number;
    totalFee: number;
    feeBreakdown: {
      name: string;
      value: number;
      id: string;
      ids: string[];
    }[];
  };
};

type HifiResponse = {
  fromCurrency: string;
  toCurrency: string;
  conversionRate: string;
};

type QuoteRateResponse = {
  name: Provider;
  rate: string;
};

async function getNoahQuote(): Promise<QuoteRateResponse> {
  const noahApiKey = process.env.NOAH_API_KEY;
  const noahApiUrl = process.env.NOAH_API_URL;
  invariant(noahApiKey, "`NOAH_API_KEY` is not set");
  invariant(noahApiUrl, "`NOAH_API_URL` is not set");

  const url = `${noahApiUrl}/v1/prices?SourceCurrency=USD&DestinationCurrency=USDC`;
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Api-Key": noahApiKey,
    },
  };

  const [error, data] = await goTry<QuoteRateResponse>(async () => {
    const response = await fetch(url, options);

    const result = (await response.json()) as NoahResponse;

    const rate = result.Items.find((item) => item.PaymentMethodCategory === "Bank")?.Rate ?? "";

    return { name: "noah", rate };
  });

  if (error) {
    throw error;
  }

  return data;
}

async function getTransakQuote(): Promise<QuoteRateResponse> {
  const transakApiKey = process.env.TRANSAK_API_KEY;
  const transakApiUrl = process.env.TRANSAK_API_URL;
  invariant(transakApiKey, "`TRANSAK_API_KEY` is not set");
  invariant(transakApiUrl, "`TRANSAK_API_URL` is not set");

  const url = `${transakApiUrl}/v1/pricing/public/quotes?partnerApiKey=${transakApiKey}&fiatCurrency=USD&cryptoCurrency=USDC&isBuyOrSell=BUY&network=ethereum&paymentMethod=credit_debit_card&fiatAmount=100`;
  const options = { method: "GET", headers: { accept: "application/json" } };

  const [error, data] = await goTry(async () => {
    const response = await fetch(url, options);
    const result = (await response.json()) as TransakResponse;

    return result;
  });

  if (error) {
    throw error;
  }
  const { conversionPrice, fiatAmount, cryptoAmount } = data.response;
  const rate = (conversionPrice / fiatAmount) * cryptoAmount;

  return { name: "transak", rate: rate.toString() };
}

async function getHifiQuote(): Promise<QuoteRateResponse> {
  const hifiApiKey = process.env.HIFI_API_KEY;
  const hifiApiUrl = process.env.HIFI_API_URL;
  invariant(hifiApiKey, "`HIFI_API_KEY` is not set");
  invariant(hifiApiUrl, "`HIFI_API_URL` is not set");

  const url = `${hifiApiUrl}/v2/onramps/rates?fromCurrency=usd&toCurrency=usdc`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${hifiApiKey}`,
    },
  };

  const [error, data] = await goTry(async () => {
    const response = await fetch(url, options);
    const result = (await response.json()) as HifiResponse;
    return result;
  });

  if (error) {
    throw error;
  }

  const rate = data.conversionRate.toString();

  return { name: "hifi", rate };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") as Provider;

  const [error, data] = await goTry(async () => {
    switch (provider) {
      case "noah":
        return getNoahQuote();
      case "transak":
        return getTransakQuote();
      case "hifi":
        return getHifiQuote();
      default:
        throw new Error("Invalid provider");
    }
  });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
