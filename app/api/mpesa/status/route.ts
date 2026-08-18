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

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const checkoutRequestId =
      searchParams.get(
        "checkoutRequestId",
      );

    if (!checkoutRequestId) {
      return NextResponse.json(
        {
          error:
            "checkoutRequestId is required.",
        },
        { status: 400 },
      );
    }

    console.log(
      "Checking M-Pesa payment:",
      checkoutRequestId,
    );

    // ----------------------------------------
    // Find payment
    // ----------------------------------------

    const { data: payment, error } =
      await supabase
        .from("payments")
        .select("*")
        .eq(
          "checkout_request_id",
          checkoutRequestId,
        )
        .maybeSingle();

    if (error) {
      console.error(
        "Supabase payment lookup error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to check payment status.",
          details: error.message,
        },
        { status: 500 },
      );
    }

    // ----------------------------------------
    // Payment has not been created yet
    // ----------------------------------------

    if (!payment) {
      console.log(
        "Payment not found:",
        checkoutRequestId,
      );

      return NextResponse.json({
        status: "pending",
        message:
          "Waiting for M-Pesa payment confirmation.",
        checkoutRequestId,
      });
    }

    console.log(
      "Payment found:",
      JSON.stringify(
        payment,
        null,
        2,
      ),
    );

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
          "Supabase booking lookup error:",
          bookingError,
        );
      } else {
        booking = bookingData;

        console.log(
          "Booking found:",
          JSON.stringify(
            booking,
            null,
            2,
          ),
        );
      }
    }

    // ----------------------------------------
    // Return payment + latest booking data
    // ----------------------------------------

    return NextResponse.json({
      // Payment information
      status: payment.status,

      resultCode:
        payment.result_code,

      resultDesc:
        payment.result_desc,

      amount:
        payment.amount,

      receiptNumber:
        payment.receipt_number,

      phoneNumber:
        payment.phone_number,

      transactionDate:
        payment.transaction_date,

      checkoutRequestId:
        payment.checkout_request_id,

      merchantRequestId:
        payment.merchant_request_id,

      adventureTitle:
        payment.adventure_title,

      receivedAt:
        payment.received_at,

      createdAt:
        payment.created_at,

      // Booking information
      booking: booking
        ? {
            bookingId:
              booking.booking_id,

            adventureTitle:
              booking.adventure_title,

            totalAmount:
              Number(
                booking.total_amount,
              ),

            totalPaid:
              Number(
                booking.total_paid,
              ),

            remainingBalance:
              Number(
                booking.remaining_balance,
              ),

            bookingStatus:
              booking.status,

            createdAt:
              booking.created_at,

            updatedAt:
              booking.updated_at,
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