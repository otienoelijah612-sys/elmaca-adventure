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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get(
      "checkoutRequestId",
    );

    if (!checkoutRequestId) {
      return NextResponse.json(
        {
          error: "checkoutRequestId is required.",
        },
        { status: 400 },
      );
    }

    // ----------------------------------------
    // Find payment
    // ----------------------------------------

    const { data: payment, error: paymentError } =
      await supabase
        .from("payments")
        .select("*")
        .eq(
          "checkout_request_id",
          checkoutRequestId,
        )
        .maybeSingle();

    if (paymentError) {
      console.error(
        "Payment lookup error:",
        paymentError,
      );

      return NextResponse.json(
        {
          error: "Unable to check payment status.",
        },
        { status: 500 },
      );
    }

    // ----------------------------------------
    // Payment record not available yet
    // ----------------------------------------

    if (!payment) {
      return NextResponse.json({
        status: "pending",
        message:
          "Waiting for M-Pesa payment confirmation.",
        checkoutRequestId,
        booking: null,
      });
    }

    // ----------------------------------------
    // Find related booking
    // ----------------------------------------

    let booking = null;

    if (payment.booking_id) {
      const {
        data: bookingData,
        error: bookingError,
      } = await supabase
        .from("bookings")
        .select(
          `
            booking_id,
            customer_name,
            adventure_title,
            total_amount,
            total_paid,
            remaining_balance,
            status,
            created_at,
            updated_at
          `,
        )
        .eq(
          "booking_id",
          payment.booking_id,
        )
        .maybeSingle();

      if (bookingError) {
        console.error(
          "Booking lookup error:",
          bookingError,
        );
      } else {
        booking = bookingData;
      }
    }

    // ----------------------------------------
    // Return payment status
    // ----------------------------------------

    return NextResponse.json({
      status: payment.status,

      resultCode:
        payment.result_code ?? null,

      resultDesc:
        payment.result_desc ?? null,

      amount: Number(payment.amount ?? 0),

      receiptNumber:
        payment.receipt_number ?? null,

      phoneNumber:
        payment.phone_number ?? null,

      transactionDate:
        payment.transaction_date ?? null,

      checkoutRequestId:
        payment.checkout_request_id,

      merchantRequestId:
        payment.merchant_request_id ?? null,

      adventureTitle:
        payment.adventure_title ?? null,

      receivedAt:
        payment.received_at ?? null,

      createdAt:
        payment.created_at ?? null,

      booking: booking
        ? {
            bookingId:
              booking.booking_id,

            customerName:
              booking.customer_name ?? null,

            adventureTitle:
              booking.adventure_title,

            totalAmount:
              Number(
                booking.total_amount ?? 0,
              ),

            totalPaid:
              Number(
                booking.total_paid ?? 0,
              ),

            remainingBalance:
              Number(
                booking.remaining_balance ?? 0,
              ),

            bookingStatus:
              booking.status,

            createdAt:
              booking.created_at ?? null,

            updatedAt:
              booking.updated_at ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "M-Pesa status error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to check payment status.",
      },
      { status: 500 },
    );
  }
}