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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      adventureTitle,
      totalAmount,
    } = body;

    // ----------------------------------------
    // Validate request
    // ----------------------------------------

    if (!adventureTitle || !totalAmount) {
      return NextResponse.json(
        {
          error:
            "Adventure title and total amount are required.",
        },
        { status: 400 },
      );
    }

    const numericAmount = Number(totalAmount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Total amount must be greater than 0.",
        },
        { status: 400 },
      );
    }

    // ----------------------------------------
    // Generate booking ID
    // ----------------------------------------

    const bookingId =
      `ELM-${Date.now().toString(36).toUpperCase()}`;

    // ----------------------------------------
    // Create booking
    // ----------------------------------------

    const { data, error } =
      await supabase
        .from("bookings")
        .insert({
          booking_id: bookingId,
          adventure_title: String(
            adventureTitle,
          ),
          total_amount: numericAmount,
          total_paid: 0,
          remaining_balance: numericAmount,
          status: "pending",
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Booking creation error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to create booking.",
          details: error.message,
        },
        { status: 500 },
      );
    }

    console.log(
      "Booking created:",
      JSON.stringify(
        data,
        null,
        2,
      ),
    );

    return NextResponse.json(
      {
        success: true,
        booking: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Booking API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to create booking.",
      },
      { status: 500 },
    );
  }
}