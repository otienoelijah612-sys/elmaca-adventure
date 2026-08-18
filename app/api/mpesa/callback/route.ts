import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface MpesaCallbackItem {
  Name: string;
  Value?: string | number;
}

interface MpesaCallbackBody {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: MpesaCallbackItem[];
      };
    };
  };
}

// ----------------------------------------
// Supabase server client
// ----------------------------------------

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

// ----------------------------------------
// GET — confirm callback endpoint
// ----------------------------------------

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message:
      "M-Pesa callback endpoint is active",
  });
}

// ----------------------------------------
// POST — receive M-Pesa callback
// ----------------------------------------

export async function POST(
  request: Request,
) {
  try {
    // ----------------------------------------
    // Read callback body
    // ----------------------------------------

    const body =
      (await request.json()) as MpesaCallbackBody;

    console.log(
      "M-Pesa callback received:",
      JSON.stringify(body, null, 2),
    );

    // ----------------------------------------
    // Get STK callback
    // ----------------------------------------

    const stkCallback =
      body?.Body?.stkCallback;

    if (!stkCallback) {
      console.error(
        "Invalid M-Pesa callback: stkCallback missing",
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received",
      });
    }

    // ----------------------------------------
    // Extract callback information
    // ----------------------------------------

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    if (!CheckoutRequestID) {
      console.error(
        "M-Pesa callback missing CheckoutRequestID",
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received",
      });
    }

    // ----------------------------------------
    // Convert callback metadata
    // into an easier object
    // ----------------------------------------

    const metadata: Record<
      string,
      string | number
    > = {};

    CallbackMetadata?.Item?.forEach(
      (item) => {
        if (item.Name) {
          metadata[item.Name] =
            item.Value ?? "";
        }
      },
    );

    // ----------------------------------------
    // Determine payment status
    // ----------------------------------------

    const resultCode =
      Number(ResultCode ?? -1);

    const paymentStatus =
      resultCode === 0
        ? "success"
        : "failed";

    // ----------------------------------------
    // Extract payment details
    // ----------------------------------------

    const amount =
      metadata.Amount !== undefined
        ? Number(metadata.Amount)
        : 0;

    const phoneNumber =
      metadata.PhoneNumber !== undefined
        ? String(metadata.PhoneNumber)
        : "Unknown";

    const receiptNumber =
      metadata.MpesaReceiptNumber !==
      undefined
        ? String(
            metadata.MpesaReceiptNumber,
          )
        : null;

    const transactionDate =
      metadata.TransactionDate !==
      undefined
        ? Number(
            metadata.TransactionDate,
          )
        : null;

    // ----------------------------------------
    // Find the original payment
    // created when STK Push was sent
    // ----------------------------------------

    console.log(
      "Looking for payment:",
      CheckoutRequestID,
    );

    const {
      data: existingPayment,
      error: paymentLookupError,
    } = await supabase
      .from("payments")
      .select("*")
      .eq(
        "checkout_request_id",
        CheckoutRequestID,
      )
      .maybeSingle();

    if (paymentLookupError) {
      console.error(
        "Payment lookup error:",
        paymentLookupError,
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received",
      });
    }

    console.log(
      "Existing payment:",
      JSON.stringify(
        existingPayment,
        null,
        2,
      ),
    );

    // ----------------------------------------
    // DUPLICATE PAYMENT PROTECTION
    // ----------------------------------------
    //
    // If this checkout request has already
    // been successfully processed, do not
    // update the payment or booking again.
    //
    // This prevents:
    //
    // First callback:
    // KSh 0 → KSh 1
    //
    // Duplicate callback:
    // KSh 1 → KSh 2  ❌
    //
    // Instead:
    //
    // First callback:
    // KSh 0 → KSh 1
    //
    // Duplicate callback:
    // No change       ✅
    //
    // ----------------------------------------

    if (
      existingPayment?.status ===
      "success"
    ) {
      console.log(
        "Payment already processed. Skipping duplicate callback:",
        CheckoutRequestID,
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Payment already processed",
      });
    }

    // ----------------------------------------
    // Preserve booking ID
    // ----------------------------------------

    const bookingId =
      existingPayment?.booking_id ??
      null;

    // ----------------------------------------
    // Prepare payment record
    // ----------------------------------------

    const payment = {
      checkout_request_id:
        CheckoutRequestID,

      merchant_request_id:
        MerchantRequestID ??
        existingPayment?.merchant_request_id ??
        null,

      adventure_title:
        existingPayment?.adventure_title ??
        "Adventure Booking",

      phone_number:
        phoneNumber !== "Unknown"
          ? phoneNumber
          : existingPayment?.phone_number ??
            "Unknown",

      amount,

      receipt_number:
        receiptNumber,

      transaction_date:
        transactionDate,

      status:
        paymentStatus,

      result_code:
        resultCode,

      result_desc:
        ResultDesc ??
        "Unknown M-Pesa result",

      received_at:
        new Date().toISOString(),

      booking_id:
        bookingId,
    };

    console.log(
      "Saving payment to Supabase:",
      JSON.stringify(
        payment,
        null,
        2,
      ),
    );

    // ----------------------------------------
    // Save/update payment
    // ----------------------------------------

    const {
      data: savedPayment,
      error: savePaymentError,
    } = await supabase
      .from("payments")
      .upsert(
        payment,
        {
          onConflict:
            "checkout_request_id",
        },
      )
      .select()
      .single();

    if (savePaymentError) {
      console.error(
        "Supabase payment save error:",
        savePaymentError,
      );

      // Acknowledge Safaricom so that
      // the callback is not repeatedly
      // retried.
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received",
      });
    }

    console.log(
      "M-Pesa payment saved successfully:",
      JSON.stringify(
        savedPayment,
        null,
        2,
      ),
    );

    // ----------------------------------------
    // Only update booking when payment
    // was successful
    // ----------------------------------------

    if (
      paymentStatus !== "success"
    ) {
      console.log(
        "Payment was not successful. Booking will not be updated.",
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received successfully",
      });
    }

    // ----------------------------------------
    // Make sure we have a booking
    // ----------------------------------------

    if (!bookingId) {
      console.error(
        "Successful payment has no booking_id:",
        CheckoutRequestID,
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received successfully",
      });
    }

    // ----------------------------------------
    // Make sure the payment amount is valid
    // ----------------------------------------

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      console.error(
        "Successful payment has invalid amount:",
        amount,
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received successfully",
      });
    }

    // ----------------------------------------
    // Find booking
    // ----------------------------------------

    console.log(
      "Updating booking:",
      bookingId,
    );

    const {
      data: booking,
      error: bookingLookupError,
    } = await supabase
      .from("bookings")
      .select(
        "booking_id, total_amount, total_paid, remaining_balance, status",
      )
      .eq(
        "booking_id",
        bookingId,
      )
      .maybeSingle();

    if (bookingLookupError) {
      console.error(
        "Booking lookup error:",
        bookingLookupError,
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received successfully",
      });
    }

    if (!booking) {
      console.error(
        "Booking not found:",
        bookingId,
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received successfully",
      });
    }

    console.log(
      "Booking found:",
      JSON.stringify(
        booking,
        null,
        2,
      ),
    );

    // ----------------------------------------
    // Calculate updated payment totals
    // ----------------------------------------

    const totalAmount =
      Number(
        booking.total_amount ?? 0,
      );

    const currentTotalPaid =
      Number(
        booking.total_paid ?? 0,
      );

    const newTotalPaid =
      currentTotalPaid + amount;

    const newRemainingBalance =
      Math.max(
        totalAmount -
          newTotalPaid,
        0,
      );

    // ----------------------------------------
    // Determine booking status
    // ----------------------------------------

    let newStatus:
      | "pending"
      | "partially_paid"
      | "fully_paid"
      | "cancelled";

    if (
      newTotalPaid >=
      totalAmount
    ) {
      newStatus =
        "fully_paid";
    } else if (
      newTotalPaid > 0
    ) {
      newStatus =
        "partially_paid";
    } else {
      newStatus =
        "pending";
    }

    // ----------------------------------------
    // Log calculation
    // ----------------------------------------

    console.log(
      "Booking payment calculation:",
      {
        bookingId,
        totalAmount,
        currentTotalPaid,
        paymentAmount: amount,
        newTotalPaid,
        newRemainingBalance,
        newStatus,
      },
    );

    // ----------------------------------------
    // Update booking
    // ----------------------------------------

    const {
      data: updatedBooking,
      error: bookingUpdateError,
    } = await supabase
      .from("bookings")
      .update({
        total_paid:
          newTotalPaid,

        remaining_balance:
          newRemainingBalance,

        status:
          newStatus,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "booking_id",
        bookingId,
      )
      .select()
      .single();

    if (bookingUpdateError) {
      console.error(
        "Booking update error:",
        bookingUpdateError,
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received successfully",
      });
    }

    // ----------------------------------------
    // Confirm booking update
    // ----------------------------------------

    console.log(
      "Booking updated successfully:",
      JSON.stringify(
        updatedBooking,
        null,
        2,
      ),
    );

    // ----------------------------------------
    // Acknowledge Safaricom
    // ----------------------------------------

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc:
        "Callback received successfully",
    });
  } catch (error) {
    console.error(
      "M-Pesa callback error:",
      error,
    );

    // Always acknowledge Safaricom.
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc:
        "Callback received",
    });
  }
}