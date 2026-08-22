import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;

if (
  !supabaseUrl ||
  !supabaseSecretKey
) {
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

export async function GET(
  request: Request,
) {
  try {
    // ----------------------------------------
    // Get booking ID
    // ----------------------------------------

    const { searchParams } =
      new URL(request.url);

    const bookingId =
      searchParams.get(
        "bookingId",
      );

    if (!bookingId) {
      return NextResponse.json(
        {
          error:
            "Booking ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const cleanBookingId =
      bookingId
        .trim()
        .toUpperCase();

    // ----------------------------------------
    // Find booking
    // ----------------------------------------

    const {
      data: booking,
      error,
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
          status
        `,
      )
      .eq(
        "booking_id",
        cleanBookingId,
      )
      .maybeSingle();

    // ----------------------------------------
    // Database error
    // ----------------------------------------

    if (error) {
      console.error(
        "Public booking lookup error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to find your booking.",
        },
        {
          status: 500,
        },
      );
    }

    // ----------------------------------------
    // Booking not found
    // ----------------------------------------

    if (!booking) {
      return NextResponse.json(
        {
          error:
            "We could not find a booking with that Booking ID.",
        },
        {
          status: 404,
        },
      );
    }

    // ----------------------------------------
    // Return limited booking information
    // ----------------------------------------

    return NextResponse.json(
      {
        success: true,

        booking: {
          bookingId:
            booking.booking_id,

          customerName:
            booking.customer_name ??
            null,

          adventureTitle:
            booking.adventure_title,

          totalAmount:
            Number(
              booking.total_amount ??
                0,
            ),

          totalPaid:
            Number(
              booking.total_paid ??
                0,
            ),

          remainingBalance:
            Number(
              booking.remaining_balance ??
                0,
            ),

          status:
            booking.status,
        },
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "Public booking lookup error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load booking.",
      },
      {
        status: 500,
      },
    );
  }
}