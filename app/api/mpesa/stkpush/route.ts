import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;

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

export async function POST(request: Request) {
  try {
    const {
      bookingId,
      phoneNumber,
      amount,
      accountReference,
      transactionDesc,
    } = await request.json();

    // ----------------------------------------
    // Validate required fields
    // ----------------------------------------

    if (!bookingId) {
      return NextResponse.json(
        {
          error: "Booking ID is required.",
        },
        { status: 400 },
      );
    }

    if (!phoneNumber || !amount) {
      return NextResponse.json(
        {
          error:
            "Phone number and amount are required.",
        },
        { status: 400 },
      );
    }

    const numericAmount = Number(amount);

    if (
      !Number.isInteger(numericAmount) ||
      numericAmount < 1
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
      .eq(
        "booking_id",
        String(bookingId),
      )
      .maybeSingle();

    if (bookingError) {
      console.error(
        "Booking lookup error:",
        bookingError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify booking.",
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
    // Validate payment amount
    // ----------------------------------------

    const totalAmount =
      Number(booking.total_amount);

    const totalPaid =
      Number(booking.total_paid ?? 0);

    const remainingBalance =
      Math.max(
        totalAmount - totalPaid,
        0,
      );

    if (remainingBalance <= 0) {
      return NextResponse.json(
        {
          error:
            "This booking has already been fully paid.",
        },
        { status: 400 },
      );
    }

    if (
      numericAmount >
      remainingBalance
    ) {
      return NextResponse.json(
        {
          error:
            `Payment cannot exceed the remaining balance of KSh ${remainingBalance}.`,
        },
        { status: 400 },
      );
    }

    // ----------------------------------------
    // Environment variables
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
      return NextResponse.json(
        {
          error:
            "M-Pesa environment variables are not configured.",
        },
        { status: 500 },
      );
    }

    // ----------------------------------------
    // Normalize Kenyan phone number
    // ----------------------------------------

    let normalizedPhone =
      String(phoneNumber)
        .trim()
        .replace(/\s+/g, "")
        .replace(/-/g, "");

    if (
      normalizedPhone.startsWith("+254")
    ) {
      normalizedPhone =
        normalizedPhone.substring(1);
    } else if (
      normalizedPhone.startsWith("0")
    ) {
      normalizedPhone =
        "254" +
        normalizedPhone.substring(1);
    } else if (
      normalizedPhone.startsWith("7") ||
      normalizedPhone.startsWith("1")
    ) {
      normalizedPhone =
        "254" + normalizedPhone;
    }

    if (
      !/^254[17]\d{8}$/.test(
        normalizedPhone,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid Kenyan M-Pesa phone number.",
        },
        { status: 400 },
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
            Authorization:
              `Basic ${credentials}`,
          },
          cache: "no-store",
        },
      );

    const tokenData =
      await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error(
        "M-Pesa token error:",
        JSON.stringify(
          tokenData,
          null,
          2,
        ),
      );

      return NextResponse.json(
        {
          error:
            "Failed to obtain M-Pesa access token.",
        },
        { status: 502 },
      );
    }

    const accessToken =
      tokenData?.access_token;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "M-Pesa access token was not returned.",
        },
        { status: 502 },
      );
    }

    // ----------------------------------------
    // Generate timestamp
    // ----------------------------------------

    const now = new Date();

    const timestamp =
      now.getUTCFullYear().toString() +
      String(
        now.getUTCMonth() + 1,
      ).padStart(2, "0") +
      String(
        now.getUTCDate(),
      ).padStart(2, "0") +
      String(
        now.getUTCHours(),
      ).padStart(2, "0") +
      String(
        now.getUTCMinutes(),
      ).padStart(2, "0") +
      String(
        now.getUTCSeconds(),
      ).padStart(2, "0");

    // ----------------------------------------
    // Generate password
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
    ).substring(0, 12);

    const description = String(
      transactionDesc ||
        booking.adventure_title ||
        "Adventure Booking",
    ).substring(0, 13);

    // ----------------------------------------
    // Send STK Push
    // ----------------------------------------

    const stkResponse =
      await fetch(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json",
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
      await stkResponse.json();

    console.log(
      "M-Pesa STK response:",
      JSON.stringify(
        stkData,
        null,
        2,
      ),
    );

    // ----------------------------------------
    // Make sure Safaricom accepted request
    // ----------------------------------------

    if (
      !stkResponse.ok ||
      stkData?.ResponseCode !== "0"
    ) {
      return NextResponse.json(
        stkData,
        {
          status:
            stkResponse.ok
              ? 400
              : stkResponse.status,
        },
      );
    }

    const checkoutRequestId =
      stkData?.CheckoutRequestID;

    const merchantRequestId =
      stkData?.MerchantRequestID;

    if (!checkoutRequestId) {
      return NextResponse.json(
        {
          error:
            "M-Pesa did not return a CheckoutRequestID.",
          details: stkData,
        },
        { status: 502 },
      );
    }

    // ----------------------------------------
    // Save/link payment to booking
    // ----------------------------------------

    const {
      data: existingPayment,
      error: existingPaymentError,
    } = await supabase
      .from("payments")
      .select("*")
      .eq(
        "checkout_request_id",
        checkoutRequestId,
      )
      .maybeSingle();

    if (existingPaymentError) {
      console.error(
        "Payment lookup error:",
        existingPaymentError,
      );
    }

    if (existingPayment) {
      // Callback may have arrived extremely quickly.
      // Preserve its successful result and attach booking.
      const {
        error: updatePaymentError,
      } = await supabase
        .from("payments")
        .update({
          booking_id:
            String(booking.booking_id),

          adventure_title:
            booking.adventure_title,

          phone_number:
            normalizedPhone,
        })
        .eq(
          "checkout_request_id",
          checkoutRequestId,
        );

      if (updatePaymentError) {
        console.error(
          "Payment booking link error:",
          updatePaymentError,
        );
      }
    } else {
      // Normal case: create pending payment record.
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
            String(booking.booking_id),

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
      }
    }

    // ----------------------------------------
    // Return STK response to website
    // ----------------------------------------

    return NextResponse.json(
      {
        ...stkData,

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
          "Failed to initiate M-Pesa payment.",
      },
      { status: 500 },
    );
  }
}