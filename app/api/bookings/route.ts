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
    // ----------------------------------------
    // Read request
    // ----------------------------------------

    const body = await request.json();

    const {
      adventureTitle,
      totalAmount,
      customerName,
    } = body;

    // ----------------------------------------
    // Validate customer name
    // ----------------------------------------

    const cleanCustomerName =
      typeof customerName === "string"
        ? customerName.trim()
        : "";

    if (!cleanCustomerName) {
      return NextResponse.json(
        {
          error:
            "Customer name is required.",
        },
        { status: 400 },
      );
    }

    // ----------------------------------------
    // Validate adventure
    // ----------------------------------------

    const cleanAdventureTitle =
      typeof adventureTitle === "string"
        ? adventureTitle.trim()
        : "";

    if (!cleanAdventureTitle) {
      return NextResponse.json(
        {
          error:
            "Adventure title is required.",
        },
        { status: 400 },
      );
    }

    // ----------------------------------------
    // Validate amount
    // ----------------------------------------

    const numericAmount =
      Number(totalAmount);

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
      `ELM-${Date.now()
        .toString(36)
        .toUpperCase()}`;

    // ----------------------------------------
    // Create booking
    // ----------------------------------------

    const {
      data,
      error,
    } = await supabase
      .from("bookings")
      .insert({
        booking_id: bookingId,

        customer_name:
          cleanCustomerName,

        adventure_title:
          cleanAdventureTitle,

        total_amount:
          numericAmount,

        total_paid:
          0,

        remaining_balance:
          numericAmount,

        status:
          "pending",
      })
      .select()
      .single();

    // ----------------------------------------
    // Handle database error
    // ----------------------------------------

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

    // ----------------------------------------
    // Log successful booking
    // ----------------------------------------

    console.log(
      "Booking created:",
      JSON.stringify(
        data,
        null,
        2,
      ),
    );

    // ----------------------------------------
    // Return booking
    // ----------------------------------------

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