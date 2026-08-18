import { NextResponse } from "next/server";

import {
  isAdminRequest,
} from "@/lib/admin-auth";

import {
  supabaseServer,
} from "@/lib/supabase-server";

export async function GET(
  request: Request,
) {
  try {
    // ----------------------------------------
    // Protect admin API
    // ----------------------------------------

    if (
      !isAdminRequest(request)
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const { searchParams } =
      new URL(request.url);

    const bookingId =
      searchParams.get(
        "bookingId",
      );

    // ========================================
    // SINGLE BOOKING DETAILS
    // ========================================

    if (bookingId) {
      // --------------------------------------
      // Get booking
      // --------------------------------------

      const {
        data: booking,
        error: bookingError,
      } =
        await supabaseServer
          .from("bookings")
          .select(
            [
              "booking_id",
              "adventure_title",
              "total_amount",
              "total_paid",
              "remaining_balance",
              "status",
              "created_at",
              "updated_at",
            ].join(", "),
          )
          .eq(
            "booking_id",
            bookingId,
          )
          .maybeSingle();

      if (bookingError) {
        console.error(
          "Admin booking detail error:",
          bookingError,
        );

        return NextResponse.json(
          {
            error:
              "Unable to load booking details.",
          },
          {
            status: 500,
          },
        );
      }

      if (!booking) {
        return NextResponse.json(
          {
            error:
              "Booking not found.",
          },
          {
            status: 404,
          },
        );
      }

      // --------------------------------------
      // Get payment history
      // --------------------------------------

      const {
        data: payments,
        error: paymentsError,
      } =
        await supabaseServer
          .from("payments")
          .select(
            [
              "id",
              "checkout_request_id",
              "merchant_request_id",
              "adventure_title",
              "phone_number",
              "amount",
              "receipt_number",
              "transaction_date",
              "status",
              "result_code",
              "result_desc",
              "received_at",
              "created_at",
              "booking_id",
            ].join(", "),
          )
          .eq(
            "booking_id",
            bookingId,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          );

      if (paymentsError) {
        console.error(
          "Admin payment history error:",
          paymentsError,
        );

        return NextResponse.json(
          {
            error:
              "Unable to load payment history.",
          },
          {
            status: 500,
          },
        );
      }

      return NextResponse.json({
        success: true,

        booking: {
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

          status:
            booking.status,

          createdAt:
            booking.created_at,

          updatedAt:
            booking.updated_at,
        },

        payments: (
          payments ?? []
        ).map(
          (payment) => ({
            id: payment.id,

            checkoutRequestId:
              payment.checkout_request_id,

            merchantRequestId:
              payment.merchant_request_id,

            adventureTitle:
              payment.adventure_title,

            phoneNumber:
              payment.phone_number,

            amount:
              Number(
                payment.amount ?? 0,
              ),

            receiptNumber:
              payment.receipt_number,

            transactionDate:
              payment.transaction_date,

            status:
              payment.status,

            resultCode:
              payment.result_code,

            resultDesc:
              payment.result_desc,

            receivedAt:
              payment.received_at,

            createdAt:
              payment.created_at,

            bookingId:
              payment.booking_id,
          }),
        ),
      });
    }

    // ========================================
    // ALL BOOKINGS
    // ========================================

    const {
      data: bookings,
      error: bookingsError,
    } =
      await supabaseServer
        .from("bookings")
        .select(
          [
            "booking_id",
            "adventure_title",
            "total_amount",
            "total_paid",
            "remaining_balance",
            "status",
            "created_at",
            "updated_at",
          ].join(", "),
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        );

    if (bookingsError) {
      console.error(
        "Admin bookings error:",
        bookingsError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load bookings.",
        },
        {
          status: 500,
        },
      );
    }

    // ----------------------------------------
    // Get all payments
    // ----------------------------------------

    const {
      data: payments,
      error: paymentsError,
    } =
      await supabaseServer
        .from("payments")
        .select(
            "booking_id, phone_number, amount, receipt_number, status, transaction_date, created_at",
          )
        .order(
          "created_at",
          {
            ascending: false,
          },
        );

    if (paymentsError) {
      console.error(
        "Admin payments error:",
        paymentsError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load payments.",
        },
        {
          status: 500,
        },
      );
    }

    // ----------------------------------------
    // Attach payment information
    // to each booking
    // ----------------------------------------

    const paymentList =
      payments ?? [];

    const result =
      (bookings ?? []).map(
        (booking) => {
          const bookingPayments =
            paymentList.filter(
              (payment) =>
                payment.booking_id ===
                booking.booking_id,
            );

          const successfulPayments =
            bookingPayments.filter(
              (payment) =>
                payment.status ===
                "success",
            );

          const latestPayment =
            bookingPayments[0] ??
            null;

          const latestSuccessfulPayment =
            successfulPayments[0] ??
            null;

          return {
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

            status:
              booking.status,

            phoneNumber:
              latestSuccessfulPayment
                ?.phone_number ??
              latestPayment
                ?.phone_number ??
              null,

            latestReceipt:
              latestSuccessfulPayment
                ?.receipt_number ??
              null,

            paymentCount:
              successfulPayments.length,

            createdAt:
              booking.created_at,

            updatedAt:
              booking.updated_at,
          };
        },
      );

    // ----------------------------------------
    // Summary
    // ----------------------------------------

    const totalBookings =
      result.length;

    const totalPaid =
      result.reduce(
        (sum, booking) =>
          sum +
          booking.totalPaid,
        0,
      );

    const totalOutstanding =
      result.reduce(
        (sum, booking) =>
          sum +
          booking.remainingBalance,
        0,
      );

    const fullyPaid =
      result.filter(
        (booking) =>
          booking.status ===
          "fully_paid",
      ).length;

    const partiallyPaid =
      result.filter(
        (booking) =>
          booking.status ===
          "partially_paid",
      ).length;

    const pending =
      result.filter(
        (booking) =>
          booking.status ===
          "pending",
      ).length;

    return NextResponse.json({
      success: true,

      summary: {
        totalBookings,
        totalPaid,
        totalOutstanding,
        fullyPaid,
        partiallyPaid,
        pending,
      },

      bookings: result,
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load admin dashboard.",
      },
      {
        status: 500,
      },
    );
  }
}