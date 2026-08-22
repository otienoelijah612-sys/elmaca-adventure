import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Supabase server environment variables are not configured.",
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

interface BookingRecord {
  booking_id: string;
  adventure_title: string;
  total_amount: number | string;
  total_paid: number | string | null;
  remaining_balance: number | string | null;
  status: string;
}

interface MpesaTokenResponse {
  access_token?: string;
  expires_in?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface MpesaStkResponse {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
  errorCode?: string;
  errorMessage?: string;
}

function normalizeKenyanPhone(phone: string): string | null {
  let normalized = phone
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "");

  if (normalized.startsWith("+254")) {
    normalized = normalized.substring(1);
  } else if (normalized.startsWith("0")) {
    normalized = `254${normalized.substring(1)}`;
  } else if (
    normalized.startsWith("7") ||
    normalized.startsWith("1")
  ) {
    normalized = `254${normalized}`;
  }

  return /^254[17]\d{8}$/.test(normalized)
    ? normalized
    : null;
}

function getTimestamp(): string {
  const now = new Date();

  return (
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0") +
    String(now.getUTCHours()).padStart(2, "0") +
    String(now.getUTCMinutes()).padStart(2, "0") +
    String(now.getUTCSeconds()).padStart(2, "0")
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      bookingId,
      phoneNumber,
      amount,
      accountReference,
      transactionDesc,
    } = body;

    // ----------------------------------------
    // Validate booking ID
    // ----------------------------------------

    const cleanBookingId =
      typeof bookingId === "string"
        ? bookingId.trim()
        : "";

    if (!cleanBookingId) {
      return NextResponse.json(
        {
          error: "Booking ID is required.",
        },
        { status: 400 },
      );
    }

    // ----------------------------------------
    // Validate phone number
    // ----------------------------------------

    const cleanPhoneInput =
      typeof phoneNumber === "string"
        ? phoneNumber
        : "";

    if (!cleanPhoneInput.trim()) {
      return NextResponse.json(
        {
          error:
            "M-Pesa phone number is required.",
        },
        { status: 400 },
      );
    }

    const normalizedPhone =
      normalizeKenyanPhone(
        cleanPhoneInput,
      );

    if (!normalizedPhone) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid Kenyan M-Pesa phone number.",
        },
        { status: 400 },
      );
    }

    // ----------------------------------------
    // Validate amount
    // ----------------------------------------

    const numericAmount = Number(amount);

    if (
      !Number.isInteger(numericAmount) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Amount must be a whole number greater than 0.",
        },
        { status: 400 },
      );
    }

    // ----------------------------------------
    // Find booking
    // ----------------------------------------

    const {
      data: booking,
      error: bookingError,
    } = await supabase
      .from("bookings")
      .select(
        "booking_id, adventure_title, total_amount, total_paid, remaining_balance, status",
      )
      .eq("booking_id", cleanBookingId)
      .maybeSingle<BookingRecord>();

    if (bookingError) {
      console.error(
        "Booking lookup error:",
        bookingError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify your booking.",
        },
        { status: 500 },
      );
    }

    if (!booking) {
      return NextResponse.json(
        {
          error:
            "Booking could not be found.",
        },
        { status: 404 },
      );
    }

    // ----------------------------------------
    // Calculate current balance
    // ----------------------------------------

    const totalAmount = Number(
      booking.total_amount,
    );

    const totalPaid = Number(
      booking.total_paid ?? 0,
    );

    const remainingBalance = Math.max(
      totalAmount - totalPaid,
      0,
    );

    // ----------------------------------------
    // Prevent payment after full payment
    // ----------------------------------------

    if (remainingBalance <= 0) {
      return NextResponse.json(
        {
          error:
            "This booking has already been fully paid.",
        },
        { status: 400 },
      );
    }

    // ----------------------------------------
    // Prevent overpayment
    // ----------------------------------------

    if (
      numericAmount >
      remainingBalance
    ) {
      return NextResponse.json(
        {
          error:
            `Payment cannot exceed the remaining balance of KSh ${remainingBalance.toLocaleString()}.`,
        },
        { status: 400 },
      );
    }

    // ----------------------------------------
    // M-Pesa configuration
    // ----------------------------------------

    const consumerKey =
      process.env.MPESA_CONSUMER_KEY;

    const consumerSecret =
      process.env.MPESA_CONSUMER_SECRET;

    const passkey =
      process.env.MPESA_PASSKEY;

    const shortcode =
      process.env.MPESA_SHORTCODE;

    const callbackUrl =
      process.env.MPESA_CALLBACK_URL;

    if (
      !consumerKey ||
      !consumerSecret ||
      !passkey ||
      !shortcode ||
      !callbackUrl
    ) {
      console.error(
        "Missing M-Pesa environment configuration.",
      );

      return NextResponse.json(
        {
          error:
            "M-Pesa payment service is not configured.",
        },
        { status: 500 },
      );
    }

    // ----------------------------------------
    // Get M-Pesa access token
    // ----------------------------------------

    const credentials = Buffer.from(
      `${consumerKey}:${consumerSecret}`,
    ).toString("base64");

    const tokenResponse =
      await fetch(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${credentials}`,
          },
          cache: "no-store",
        },
      );

    const tokenData =
      (await tokenResponse.json()) as MpesaTokenResponse;

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      console.error(
        "M-Pesa token request failed:",
        tokenData,
      );

      return NextResponse.json(
        {
          error:
            "Unable to connect to M-Pesa.",
        },
        { status: 502 },
      );
    }

    // ----------------------------------------
    // Generate timestamp
    // ----------------------------------------

    const timestamp =
      getTimestamp();

    // ----------------------------------------
    // Generate STK password
    // ----------------------------------------

    const password = Buffer.from(
      `${shortcode}${passkey}${timestamp}`,
    ).toString("base64");

    // ----------------------------------------
    // Prepare payment information
    // ----------------------------------------

    const reference = String(
      accountReference ||
        booking.booking_id ||
        "ELMACA",
    )
      .trim()
      .substring(0, 12);

    const description = String(
      transactionDesc ||
        booking.adventure_title ||
        "Adventure Booking",
    )
      .trim()
      .substring(0, 13);

    // ----------------------------------------
    // Send STK Push
    // ----------------------------------------

    const stkResponse =
      await fetch(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            BusinessShortCode:
              shortcode,

            Password:
              password,

            Timestamp:
              timestamp,

            TransactionType:
              "CustomerPayBillOnline",

            Amount:
              numericAmount,

            PartyA:
              normalizedPhone,

            PartyB:
              shortcode,

            PhoneNumber:
              normalizedPhone,

            CallBackURL:
              callbackUrl,

            AccountReference:
              reference,

            TransactionDesc:
              description,
          }),
        },
      );

    const stkData =
      (await stkResponse.json()) as MpesaStkResponse;

    console.log(
      "M-Pesa STK response:",
      JSON.stringify(
        stkData,
        null,
        2,
      ),
    );

    // ----------------------------------------
    // Handle failed STK request
    // ----------------------------------------

    if (
      !stkResponse.ok ||
      stkData.ResponseCode !== "0"
    ) {
      return NextResponse.json(
        {
          error:
            stkData.errorMessage ||
            stkData.CustomerMessage ||
            stkData.ResponseDescription ||
            "M-Pesa payment could not be initiated.",
          details:
            process.env.NODE_ENV ===
            "development"
              ? stkData
              : undefined,
        },
        {
          status:
            stkResponse.ok
              ? 400
              : 502,
        },
      );
    }

    // ----------------------------------------
    // Confirm CheckoutRequestID
    // ----------------------------------------

    const checkoutRequestId =
      stkData.CheckoutRequestID;

    const merchantRequestId =
      stkData.MerchantRequestID;

    if (!checkoutRequestId) {
      console.error(
        "M-Pesa did not return CheckoutRequestID.",
      );

      return NextResponse.json(
        {
          error:
            "M-Pesa accepted the request but did not return a payment reference.",
        },
        { status: 502 },
      );
    }

    // ----------------------------------------
    // Save pending payment
    // ----------------------------------------

    const {
      data: existingPayment,
      error: existingPaymentError,
    } = await supabase
      .from("payments")
      .select(
        "checkout_request_id, status, booking_id",
      )
      .eq(
        "checkout_request_id",
        checkoutRequestId,
      )
      .maybeSingle();

    if (existingPaymentError) {
      console.error(
        "Existing payment lookup error:",
        existingPaymentError,
      );
    }

    if (!existingPayment) {
      const {
        error: paymentInsertError,
      } = await supabase
        .from("payments")
        .insert({
          checkout_request_id:
            checkoutRequestId,

          merchant_request_id:
            merchantRequestId ?? null,

          booking_id:
            booking.booking_id,

          adventure_title:
            booking.adventure_title,

          phone_number:
            normalizedPhone,

          amount:
            numericAmount,

          receipt_number:
            null,

          transaction_date:
            null,

          status:
            "pending",

          result_code:
            null,

          result_desc:
            "STK Push sent. Waiting for M-Pesa confirmation.",

          received_at:
            new Date().toISOString(),
        });

      if (paymentInsertError) {
        console.error(
          "Payment insert error:",
          paymentInsertError,
        );

        return NextResponse.json(
          {
            error:
              "Payment request was sent, but we could not save the payment record. Please contact Elmaca Adventure before trying again.",
          },
          { status: 500 },
        );
      }
    } else if (
      existingPayment.booking_id !==
      booking.booking_id
    ) {
      console.error(
        "Checkout request belongs to a different booking:",
        {
          checkoutRequestId,
          existingBookingId:
            existingPayment.booking_id,
          requestedBookingId:
            booking.booking_id,
        },
      );

      return NextResponse.json(
        {
          error:
            "This payment request is already associated with another booking.",
        },
        { status: 409 },
      );
    }

    // ----------------------------------------
    // Return successful STK response
    // ----------------------------------------

    return NextResponse.json(
      {
        success: true,

        ResponseCode:
          stkData.ResponseCode,

        ResponseDescription:
          stkData.ResponseDescription,

        CustomerMessage:
          stkData.CustomerMessage,

        MerchantRequestID:
          merchantRequestId,

        CheckoutRequestID:
          checkoutRequestId,

        bookingId:
          booking.booking_id,

        amount:
          numericAmount,

        remainingBalanceBeforePayment:
          remainingBalance,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "M-Pesa STK Push error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to initiate M-Pesa payment. Please try again.",
      },
      { status: 500 },
    );
  }
}