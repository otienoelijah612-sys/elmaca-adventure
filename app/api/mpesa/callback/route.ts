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

interface PaymentRecord {
  checkout_request_id: string;
  merchant_request_id?: string | null;
  booking_id?: string | null;
  adventure_title?: string | null;
  phone_number?: string | null;
  amount?: number | string | null;
  receipt_number?: string | null;
  transaction_date?: number | string | null;
  status?: string | null;
  result_code?: number | null;
  result_desc?: string | null;
  received_at?: string | null;
}

interface BookingRecord {
  booking_id: string;
  total_amount: number | string;
  total_paid: number | string | null;
  remaining_balance: number | string | null;
  status: string;
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
// Small delay helper
// ----------------------------------------

function delay(
  milliseconds: number,
) {
  return new Promise((resolve) =>
    setTimeout(
      resolve,
      milliseconds,
    ),
  );
}

// ----------------------------------------
// Find payment with short retry window
// ----------------------------------------

async function findPayment(
  checkoutRequestId: string,
): Promise<PaymentRecord | null> {
  const maxAttempts = 5;
  const retryDelay = 1000;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("payments")
      .select("*")
      .eq(
        "checkout_request_id",
        checkoutRequestId,
      )
      .maybeSingle();

    if (error) {
      console.error(
        `Payment lookup error (attempt ${attempt}):`,
        error,
      );

      if (
        attempt < maxAttempts
      ) {
        await delay(
          retryDelay,
        );

        continue;
      }

      return null;
    }

    if (data) {
      return data as PaymentRecord;
    }

    if (
      attempt < maxAttempts
    ) {
      await delay(
        retryDelay,
      );
    }
  }

  return null;
}

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
    const body =
      (await request.json()) as MpesaCallbackBody;

    console.log(
      "M-Pesa callback received:",
      JSON.stringify(
        body,
        null,
        2,
      ),
    );

    // ----------------------------------------
    // Get STK callback
    // ----------------------------------------

    const stkCallback =
      body?.Body?.stkCallback;

    if (!stkCallback) {
      console.error(
        "Invalid M-Pesa callback: stkCallback missing.",
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received",
      });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // ----------------------------------------
    // Validate CheckoutRequestID
    // ----------------------------------------

    if (!CheckoutRequestID) {
      console.error(
        "M-Pesa callback missing CheckoutRequestID.",
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received",
      });
    }

    // ----------------------------------------
    // Convert callback metadata
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
    // Determine payment result
    // ----------------------------------------

    const resultCode = Number(
      ResultCode ?? -1,
    );

    const paymentStatus =
      resultCode === 0
        ? "success"
        : "failed";

    // ----------------------------------------
    // Extract payment information
    // ----------------------------------------

    const callbackAmount =
      metadata.Amount !== undefined
        ? Number(metadata.Amount)
        : 0;

    const callbackPhone =
      metadata.PhoneNumber !== undefined
        ? String(
            metadata.PhoneNumber,
          )
        : null;

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
    // Find original payment
    // ----------------------------------------

    console.log(
      "Looking for payment:",
      CheckoutRequestID,
    );

    const existingPayment =
      await findPayment(
        CheckoutRequestID,
      );

    // ----------------------------------------
    // Payment not found
    // ----------------------------------------

    if (!existingPayment) {
      console.error(
        "Payment record could not be found after retry window:",
        CheckoutRequestID,
      );

      /*
       * We acknowledge the callback so Safaricom
       * does not continue retrying indefinitely.
       *
       * The important point is that the STK route
       * normally creates the payment record before
       * returning control to the customer.
       */
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
    // Duplicate protection
    // ----------------------------------------

    if (
      existingPayment.status ===
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
    // Use original payment amount when the
    // callback does not provide a valid amount
    // ----------------------------------------

    const storedAmount = Number(
      existingPayment.amount ?? 0,
    );

    const amount =
      Number.isFinite(
        callbackAmount,
      ) &&
      callbackAmount > 0
        ? callbackAmount
        : storedAmount;

    // ----------------------------------------
    // Preserve original booking information
    // ----------------------------------------

    const bookingId =
      existingPayment.booking_id ??
      null;

    const phoneNumber =
      callbackPhone ??
      existingPayment.phone_number ??
      null;

    const adventureTitle =
      existingPayment.adventure_title ??
      "Adventure Booking";

    // ----------------------------------------
    // Validate successful payment
    // ----------------------------------------

    if (
      paymentStatus === "success" &&
      (!Number.isFinite(amount) ||
        amount <= 0)
    ) {
      console.error(
        "Successful M-Pesa callback has invalid amount:",
        amount,
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received",
      });
    }

    // ----------------------------------------
    // Save payment result
    // ----------------------------------------

    const updatedPayment = {
      checkout_request_id:
        CheckoutRequestID,

      merchant_request_id:
        MerchantRequestID ??
        existingPayment.merchant_request_id ??
        null,

      booking_id:
        bookingId,

      adventure_title:
        adventureTitle,

      phone_number:
        phoneNumber,

      amount,

      receipt_number:
        receiptNumber ??
        existingPayment.receipt_number ??
        null,

      transaction_date:
        transactionDate ??
        existingPayment.transaction_date ??
        null,

      status:
        paymentStatus,

      result_code:
        resultCode,

      result_desc:
        ResultDesc ??
        "M-Pesa payment processed.",

      received_at:
        new Date().toISOString(),
    };

    console.log(
      "Updating payment:",
      JSON.stringify(
        updatedPayment,
        null,
        2,
      ),
    );

    const {
      data: savedPayment,
      error: paymentUpdateError,
    } = await supabase
      .from("payments")
      .update(
        updatedPayment,
      )
      .eq(
        "checkout_request_id",
        CheckoutRequestID,
      )
      .select()
      .single();

    if (paymentUpdateError) {
      console.error(
        "Payment update error:",
        paymentUpdateError,
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received",
      });
    }

    console.log(
      "Payment updated successfully:",
      JSON.stringify(
        savedPayment,
        null,
        2,
      ),
    );

    // ----------------------------------------
    // Failed payment
    // ----------------------------------------

    if (
      paymentStatus !== "success"
    ) {
      console.log(
        "M-Pesa payment failed. Booking totals will not be changed.",
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Callback received successfully",
      });
    }

    // ----------------------------------------
    // Successful payment requires booking
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
    // Find booking
    // ----------------------------------------

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
      .maybeSingle<BookingRecord>();

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

    // ----------------------------------------
    // Calculate new booking totals
    // ----------------------------------------

    const totalAmount =
      Number(
        booking.total_amount ?? 0,
      );

    const currentTotalPaid =
      Number(
        booking.total_paid ?? 0,
      );

    // ----------------------------------------
    // Protect against an already-completed
    // booking being charged again
    // ----------------------------------------

    const existingRemainingBalance =
      Math.max(
        totalAmount -
          currentTotalPaid,
        0,
      );

    if (
      existingRemainingBalance <= 0
    ) {
      console.log(
        "Booking is already fully paid. No additional booking total will be added:",
        bookingId,
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Payment already reflected on booking",
      });
    }

    // ----------------------------------------
    // Prevent payment from exceeding balance
    // ----------------------------------------

    const amountToApply =
      Math.min(
        amount,
        existingRemainingBalance,
      );

    const newTotalPaid =
      currentTotalPaid +
      amountToApply;

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
      newRemainingBalance ===
      0
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

    console.log(
      "Booking payment calculation:",
      {
        bookingId,
        totalAmount,
        currentTotalPaid,
        paymentAmount: amount,
        amountApplied:
          amountToApply,
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