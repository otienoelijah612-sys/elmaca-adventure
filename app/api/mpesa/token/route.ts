import { NextResponse } from "next/server";

export async function GET() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    return NextResponse.json(
      {
        error: "M-Pesa credentials are not configured.",
      },
      { status: 500 },
    );
  }

  const credentials = Buffer.from(
    `${consumerKey}:${consumerSecret}`,
  ).toString("base64");

  try {
    const response = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to authenticate with M-Pesa.",
          details: data,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error("M-Pesa authentication error:", error);

    return NextResponse.json(
      {
        error: "Unable to connect to M-Pesa.",
      },
      { status: 500 },
    );
  }
}