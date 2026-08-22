"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Smartphone,
  X,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import Button from "./Button";
import { generateReceipt } from "@/lib/generateReceipt";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  adventureTitle?: string;
  adventurePrice?: number;
}

interface Booking {
  booking_id: string;
  customer_name?: string | null;
  adventure_title: string;
  total_amount: number;
  total_paid: number;
  remaining_balance: number;
  status:
    | "pending"
    | "partially_paid"
    | "fully_paid"
    | "cancelled";
}

interface PaymentStatus {
  status: "pending" | "success" | "failed";

  resultCode?: number | null;
  resultDesc?: string | null;

  amount?: number;
  receiptNumber?: string | null;
  phoneNumber?: string | null;

  transactionDate?: string | number | null;

  checkoutRequestId?: string;
  merchantRequestId?: string;

  adventureTitle?: string;

  receivedAt?: string | null;
  createdAt?: string | null;

  message?: string;

  booking?: {
    bookingId: string;
    customerName?: string | null;
    adventureTitle: string;
    totalAmount: number;
    totalPaid: number;
    remainingBalance: number;

    bookingStatus:
      | "pending"
      | "partially_paid"
      | "fully_paid"
      | "cancelled";

    createdAt?: string;
    updatedAt?: string;
  } | null;
}

export default function BookingModal({
  isOpen,
  onClose,
  adventureTitle,
  adventurePrice = 0,
}: BookingModalProps) {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [checkingPayment, setCheckingPayment] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus | null>(null);

  const [error, setError] = useState("");

  const [generatingReceipt, setGeneratingReceipt] =
    useState(false);

  // ----------------------------------------
  // Payment calculations
  // ----------------------------------------

  const numericAmount = Number(amount);

  const currentBalance =
    booking?.remaining_balance ??
    adventurePrice;

  const remainingBalance =
    currentBalance > 0 &&
    numericAmount > 0
      ? Math.max(
          currentBalance - numericAmount,
          0,
        )
      : currentBalance;

  const isFullPayment =
    currentBalance > 0 &&
    numericAmount === currentBalance;

  // ----------------------------------------
  // Reset modal
  // ----------------------------------------

  const resetModal = () => {
    setName("");
    setPhoneNumber("");
    setAmount("");
    setBooking(null);
    setLoading(false);
    setCheckingPayment(false);
    setSuccess(false);
    setPaymentStatus(null);
    setError("");
    setGeneratingReceipt(false);
  };

  // ----------------------------------------
  // Close modal
  // ----------------------------------------

  const handleClose = () => {
    /*
     * Do not allow the customer to close the
     * modal while an STK request is being sent
     * or while payment confirmation is active.
     */

    if (
      loading ||
      checkingPayment ||
      generatingReceipt
    ) {
      return;
    }

    resetModal();
    onClose();
  };

  // ----------------------------------------
  // Wait helper
  // ----------------------------------------

  const wait = (
    milliseconds: number,
  ) =>
    new Promise<void>(
      (resolve) =>
        setTimeout(
          resolve,
          milliseconds,
        ),
    );

  // ----------------------------------------
  // Check M-Pesa payment status
  // ----------------------------------------

  const checkPaymentStatus = async (
    checkoutRequestId: string,
  ) => {
    /*
     * 60 attempts x 3 seconds
     * = approximately 3 minutes.
     *
     * If confirmation takes longer,
     * we DO NOT tell the customer
     * that the payment failed.
     */

    const maxAttempts = 60;
    const interval = 3000;

    setCheckingPayment(true);
    setError("");

    console.log(
      "Starting M-Pesa payment confirmation:",
      checkoutRequestId,
    );

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt++
    ) {
      try {
        console.log(
          `Checking M-Pesa payment status ${attempt}/${maxAttempts}`,
        );

        const response =
          await fetch(
            `/api/mpesa/status?checkoutRequestId=${encodeURIComponent(
              checkoutRequestId,
            )}`,
            {
              method: "GET",
              cache: "no-store",
            },
          );

        /*
         * If the status endpoint returns an error,
         * keep checking instead of declaring failure.
         */

        if (!response.ok) {
          console.warn(
            "M-Pesa status endpoint returned:",
            response.status,
          );

          if (
            attempt <
            maxAttempts
          ) {
            await wait(
              interval,
            );
          }

          continue;
        }

        const data: PaymentStatus =
          await response.json();

        console.log(
          "M-Pesa payment status:",
          data,
        );

        setPaymentStatus(data);

        // --------------------------------------
        // Update booking information
        // --------------------------------------

        if (data.booking) {
          const latestBooking: Booking = {
            booking_id:
              data.booking.bookingId,

            customer_name:
              data.booking.customerName ??
              null,

            adventure_title:
              data.booking.adventureTitle,

            total_amount:
              Number(
                data.booking.totalAmount ??
                  0,
              ),

            total_paid:
              Number(
                data.booking.totalPaid ??
                  0,
              ),

            remaining_balance:
              Number(
                data.booking.remainingBalance ??
                  0,
              ),

            status:
              data.booking.bookingStatus,
          };

          setBooking(
            latestBooking,
          );
        }

        // --------------------------------------
        // SUCCESS
        // --------------------------------------

        if (
          data.status ===
          "success"
        ) {
          console.log(
            "M-Pesa payment confirmed successfully.",
            data,
          );

          setSuccess(true);
          setCheckingPayment(false);
          setLoading(false);

          return;
        }

        // --------------------------------------
        // FAILED
        // --------------------------------------

        if (
          data.status ===
          "failed"
        ) {
          console.warn(
            "M-Pesa payment failed:",
            data,
          );

          setError(
            data.resultDesc ||
              data.message ||
              "M-Pesa payment was not completed.",
          );

          setCheckingPayment(false);
          setLoading(false);

          return;
        }

        // --------------------------------------
        // PENDING
        // --------------------------------------

        console.log(
          "M-Pesa payment still pending.",
        );
      } catch (error) {
        /*
         * Network/status errors are not payment
         * failures. Continue checking.
         */

        console.error(
          "Payment status check error:",
          error,
        );
      }

      /*
       * Don't wait after the final attempt.
       */

      if (
        attempt <
        maxAttempts
      ) {
        await wait(
          interval,
        );
      }
    }

    // ----------------------------------------
    // Confirmation timeout
    // ----------------------------------------

    console.warn(
      "M-Pesa confirmation timeout. Payment may still be processing.",
    );

    setCheckingPayment(false);
    setLoading(false);

    setError(
      "Your payment request is still being confirmed by M-Pesa. If you completed the payment on your phone, please keep your M-Pesa confirmation message. Do not make another payment.",
    );
  };

  // ----------------------------------------
  // Handle payment
  // ----------------------------------------

  const handlePayment = async () => {
    setError("");
    setSuccess(false);
    setPaymentStatus(null);

    const cleanName =
      name.trim();

    const cleanPhone =
      phoneNumber.replace(
        /\s+/g,
        "",
      );

    const paymentAmount =
      Number(amount);

    // ----------------------------------------
    // Name validation
    // ----------------------------------------

    if (!cleanName) {
      setError(
        "Please enter your name.",
      );

      return;
    }

    // ----------------------------------------
    // Phone validation
    // ----------------------------------------

    if (!cleanPhone) {
      setError(
        "Please enter your M-Pesa phone number.",
      );

      return;
    }

    // ----------------------------------------
    // Amount validation
    // ----------------------------------------

    if (
      !Number.isInteger(
        paymentAmount,
      ) ||
      paymentAmount <= 0
    ) {
      setError(
        "Please enter a valid whole-number payment amount.",
      );

      return;
    }

    // ----------------------------------------
    // Adventure price validation
    // ----------------------------------------

    if (
      !adventurePrice ||
      adventurePrice <= 0
    ) {
      setError(
        "The adventure price could not be determined. Please try again.",
      );

      return;
    }

    // ----------------------------------------
    // Prevent overpayment
    // ----------------------------------------

    if (
      paymentAmount >
      currentBalance
    ) {
      setError(
        `You cannot pay more than the remaining balance of KSh ${currentBalance.toLocaleString()}.`,
      );

      return;
    }

    setLoading(true);

    try {
      let activeBooking =
        booking;

      // ----------------------------------------
      // 1. Create booking
      // ----------------------------------------

      /*
       * Current system:
       *
       * One booking is created for this
       * customer during the booking process.
       *
       * Customers do NOT enter a Booking ID.
       */

      if (!activeBooking) {
        console.log(
          "Creating new booking...",
        );

        const bookingResponse =
          await fetch(
            "/api/bookings",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                customerName:
                  cleanName,

                adventureTitle:
                  adventureTitle ||
                  "Adventure Booking",

                totalAmount:
                  adventurePrice,
              }),
            },
          );

        const bookingData =
          await bookingResponse.json();

        console.log(
          "Booking creation response:",
          bookingData,
        );

        if (
          !bookingResponse.ok
        ) {
          throw new Error(
            bookingData?.error ||
              "Unable to create your booking.",
          );
        }

        activeBooking =
          bookingData?.booking;

        if (
          !activeBooking?.booking_id
        ) {
          throw new Error(
            "Booking was created, but no booking ID was returned.",
          );
        }

        setBooking(
          activeBooking,
        );

        console.log(
          "Booking created successfully:",
          activeBooking.booking_id,
        );
      }

      // ----------------------------------------
      // 2. Confirm Booking ID
      // ----------------------------------------

      if (
        !activeBooking?.booking_id
      ) {
        throw new Error(
          "Booking ID could not be created. Please try again.",
        );
      }

      console.log(
        "Using booking:",
        activeBooking.booking_id,
      );

      // ----------------------------------------
      // 3. Send STK Push
      // ----------------------------------------

      console.log(
        "Sending M-Pesa STK Push...",
      );

      const response =
        await fetch(
          "/api/mpesa/stkpush",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              bookingId:
                activeBooking.booking_id,

              phoneNumber:
                cleanPhone,

              amount:
                paymentAmount,

              accountReference:
                activeBooking.booking_id,

              transactionDesc:
                adventureTitle
                  ? `Booking - ${adventureTitle}`
                  : "Adventure Booking",
            }),
          },
        );

      const data =
        await response.json();

      console.log(
        "M-Pesa STK response:",
        data,
      );

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            data?.errorMessage ||
            "Unable to initiate M-Pesa payment.",
        );
      }

      // ----------------------------------------
      // 4. STK request accepted
      // ----------------------------------------

      if (
        data?.ResponseCode ===
        "0"
      ) {
        const checkoutRequestId =
          data?.CheckoutRequestID;

        if (
          !checkoutRequestId
        ) {
          throw new Error(
            "M-Pesa accepted the request, but no checkout request ID was returned.",
          );
        }

        console.log(
          "M-Pesa STK accepted:",
          checkoutRequestId,
        );

        setLoading(false);
        setCheckingPayment(true);

        await checkPaymentStatus(
          checkoutRequestId,
        );

        return;
      }

      throw new Error(
        data?.CustomerMessage ||
          data?.ResponseDescription ||
          data?.errorMessage ||
          "M-Pesa payment could not be initiated.",
      );
    } catch (err) {
      console.error(
        "Payment error:",
        err,
      );

      setLoading(false);
      setCheckingPayment(false);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  // ----------------------------------------
  // Generate receipt
  // ----------------------------------------

  const handleDownloadReceipt =
    async () => {
      if (
        !paymentStatus ||
        paymentStatus.status !==
          "success"
      ) {
        setError(
          "A receipt can only be generated after payment has been confirmed.",
        );

        return;
      }

      setGeneratingReceipt(true);
      setError("");

      try {
        const bookingId =
          booking?.booking_id ??
          paymentStatus.booking
            ?.bookingId;

        if (!bookingId) {
          throw new Error(
            "Booking ID is unavailable.",
          );
        }

        const customerName =
          booking?.customer_name ??
          paymentStatus.booking
            ?.customerName ??
          name;

        const tripTotal =
          Number(
            booking?.total_amount ??
              paymentStatus.booking
                ?.totalAmount ??
              adventurePrice,
          );

        const amountPaid =
          Number(
            paymentStatus.amount ??
              0,
          );

        const remaining =
          Number(
            booking?.remaining_balance ??
              paymentStatus.booking
                ?.remainingBalance ??
              Math.max(
                tripTotal -
                  amountPaid,
                0,
              ),
          );

        await generateReceipt({
          bookingId,

          customerName:
            customerName ||
            "Customer",

          adventureTitle:
            booking?.adventure_title ??
            paymentStatus.booking
              ?.adventureTitle ??
            adventureTitle ??
            "Adventure Booking",

          amountPaid,

          tripTotal,

          remainingBalance:
            remaining,

          receiptNumber:
            paymentStatus.receiptNumber ??
            null,

          phoneNumber:
            paymentStatus.phoneNumber ??
            phoneNumber,

          transactionDate:
            paymentStatus.transactionDate ??
            null,
        });

        console.log(
          "Receipt downloaded successfully.",
        );
      } catch (error) {
        console.error(
          "Receipt generation error:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "We could not generate your receipt. Please try again.",
        );
      } finally {
        setGeneratingReceipt(
          false,
        );
      }
    };

  // ----------------------------------------
  // Full payment
  // ----------------------------------------

  const setFullPayment = () => {
    setAmount(
      currentBalance.toString(),
    );

    setError("");
  };

  // ----------------------------------------
  // Partial payment
  // ----------------------------------------

  const setPartialPayment = () => {
    setAmount("");

    setError("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background */}
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            transition={{
              duration: 0.25,
            }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[90vh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            {/* Close */}
            <button
              onClick={
                handleClose
              }
              disabled={
                loading ||
                checkingPayment ||
                generatingReceipt
              }
              className="absolute right-4 top-4 rounded-full p-2 text-slate-light transition-colors hover:bg-slate/5 hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close booking modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icon */}
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange/10">
              <Smartphone className="h-7 w-7 text-orange" />
            </div>

            {/* Heading */}
            <h3
              id="booking-modal-title"
              className="font-display text-2xl font-semibold text-navy"
            >
              Book Your Slot
            </h3>

            {adventureTitle && (
              <p className="mt-1 text-sm text-slate-light">
                {adventureTitle}
              </p>
            )}

            {/* ================================= */}
            {/* SUCCESS */}
            {/* ================================= */}

            {success ? (
              <div className="mt-6">
                <div className="rounded-2xl bg-green-50 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />

                  <h4 className="mt-4 font-display text-xl font-semibold text-navy">
                    Payment Confirmed
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate">
                    Your M-Pesa payment has been successfully received.
                  </p>

                  {/* Booking ID */}
                  {booking?.booking_id && (
                    <div className="mt-5 rounded-xl bg-white p-4 text-left">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-light">
                        Booking ID
                      </p>

                      <p className="mt-1 font-display text-lg font-bold text-navy">
                        {
                          booking.booking_id
                        }
                      </p>
                    </div>
                  )}

                  {/* Amount Paid */}
                  {paymentStatus?.amount !==
                    undefined && (
                    <div className="mt-3 rounded-xl bg-white p-4 text-left">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-light">
                        Amount Paid
                      </p>

                      <p className="mt-1 font-display text-xl font-bold text-navy">
                        KSh{" "}
                        {Number(
                          paymentStatus.amount,
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Trip Total */}
                  <div className="mt-3 rounded-xl bg-white p-4 text-left">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-light">
                      Trip Total
                    </p>

                    <p className="mt-1 font-display text-lg font-semibold text-navy">
                      KSh{" "}
                      {Number(
                        booking?.total_amount ??
                          paymentStatus?.booking
                            ?.totalAmount ??
                          adventurePrice,
                      ).toLocaleString()}
                    </p>
                  </div>

                  {/* Remaining Balance */}
                  <div className="mt-3 rounded-xl bg-white p-4 text-left">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-light">
                      Remaining Balance
                    </p>

                    <p className="mt-1 font-display text-lg font-semibold text-orange">
                      KSh{" "}
                      {Number(
                        booking?.remaining_balance ??
                          paymentStatus?.booking
                            ?.remainingBalance ??
                          Math.max(
                            adventurePrice -
                              Number(
                                paymentStatus?.amount ??
                                  0,
                              ),
                            0,
                          ),
                      ).toLocaleString()}
                    </p>
                  </div>

                  {/* M-Pesa Receipt */}
                  {paymentStatus?.receiptNumber && (
                    <div className="mt-3 rounded-xl bg-white p-4 text-left">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-light">
                        M-Pesa Receipt
                      </p>

                      <p className="mt-1 font-display text-lg font-bold text-navy">
                        {
                          paymentStatus.receiptNumber
                        }
                      </p>
                    </div>
                  )}

                  {/* Booking Status */}
                  {(booking?.status ||
                    paymentStatus?.booking
                      ?.bookingStatus) && (
                    <div className="mt-3 rounded-xl bg-white p-4 text-left">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-light">
                        Booking Status
                      </p>

                      <p className="mt-1 font-display text-lg font-semibold capitalize text-navy">
                        {(
                          booking?.status ??
                          paymentStatus?.booking
                            ?.bookingStatus ??
                          "pending"
                        ).replace(
                          "_",
                          " ",
                        )}
                      </p>
                    </div>
                  )}

                  <p className="mt-4 text-xs leading-5 text-slate-light">
                    Keep your M-Pesa confirmation message as proof of payment.
                  </p>
                </div>

                {/* Receipt / Done Buttons */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="flex-1"
                    onClick={
                      handleDownloadReceipt
                    }
                    disabled={
                      generatingReceipt
                    }
                  >
                    {generatingReceipt ? (
                      <>
                        <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                        Preparing Receipt...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 inline-block h-4 w-4" />
                        Download Receipt
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={
                      handleClose
                    }
                    disabled={
                      generatingReceipt
                    }
                  >
                    Done
                  </Button>
                </div>

                {/* Receipt Error */}
                {error && (
                  <div className="mt-4 flex gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <p>
                      {error}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* ================================= */}
                {/* PAYMENT FORM */}
                {/* ================================= */}

                <div className="mt-6 space-y-5">

                  {/* Trip Cost */}
                  <div className="rounded-xl bg-navy p-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                      Trip Cost
                    </p>

                    <p className="mt-1 font-display text-2xl font-bold">
                      KSh{" "}
                      {adventurePrice.toLocaleString()}
                    </p>
                  </div>

                  {/* Booking ID */}
                  {booking?.booking_id && (
                    <div className="rounded-xl border border-orange/20 bg-orange/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-light">
                        Booking ID
                      </p>

                      <p className="mt-1 font-display text-lg font-bold text-navy">
                        {
                          booking.booking_id
                        }
                      </p>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label
                      htmlFor="customerName"
                      className="mb-2 block text-sm font-medium text-navy"
                    >
                      Your Name
                    </label>

                    <input
                      id="customerName"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value,
                        )
                      }
                      disabled={
                        loading ||
                        checkingPayment
                      }
                      className="w-full rounded-xl border border-slate/20 bg-white px-4 py-3 text-navy outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20 disabled:bg-slate/5"
                    />
                  </div>

                  {/* M-Pesa Phone */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium text-navy"
                      >
                        M-Pesa Number
                      </label>

                      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Payment request will be sent to this number
                      </span>
                    </div>

                    <input
                      id="phoneNumber"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="07XXXXXXXX or 2547XXXXXXXX"
                      value={
                        phoneNumber
                      }
                      onChange={(event) =>
                        setPhoneNumber(
                          event.target.value,
                        )
                      }
                      disabled={
                        loading ||
                        checkingPayment
                      }
                      className="w-full rounded-xl border border-slate/20 bg-white px-4 py-3 text-navy outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20 disabled:bg-slate/5"
                    />
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-navy">
                      Payment Type
                    </label>

                    <div className="grid grid-cols-2 gap-3">

                      {/* Full Payment */}
                      <button
                        type="button"
                        onClick={
                          setFullPayment
                        }
                        disabled={
                          loading ||
                          checkingPayment
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          isFullPayment
                            ? "border-orange bg-orange/10"
                            : "border-slate/20 bg-white hover:border-orange/50"
                        }`}
                      >
                        <p className="text-sm font-semibold text-navy">
                          Pay in Full
                        </p>

                        <p className="mt-1 text-sm text-slate-light">
                          KSh{" "}
                          {currentBalance.toLocaleString()}
                        </p>
                      </button>

                      {/* Partial Payment */}
                      <button
                        type="button"
                        onClick={
                          setPartialPayment
                        }
                        disabled={
                          loading ||
                          checkingPayment
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          amount &&
                          numericAmount <
                            currentBalance
                            ? "border-orange bg-orange/10"
                            : "border-slate/20 bg-white hover:border-orange/50"
                        }`}
                      >
                        <p className="text-sm font-semibold text-navy">
                          Partial Payment
                        </p>

                        <p className="mt-1 text-sm text-slate-light">
                          Choose amount
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label
                      htmlFor="amount"
                      className="mb-2 block text-sm font-medium text-navy"
                    >
                      Amount to Pay
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-light">
                        KSh
                      </span>

                      <input
                        id="amount"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max={
                          currentBalance
                        }
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(event) => {
                          setAmount(
                            event.target.value,
                          );

                          setError("");
                        }}
                        disabled={
                          loading ||
                          checkingPayment
                        }
                        className="w-full rounded-xl border border-slate/20 bg-white py-3 pl-14 pr-4 text-navy outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20 disabled:bg-slate/5"
                      />
                    </div>
                  </div>

                  {/* Balance Preview */}
                  {numericAmount > 0 &&
                    numericAmount <=
                      currentBalance && (
                      <div className="rounded-xl border border-orange/20 bg-orange/5 p-4">

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate">
                            Paying now
                          </span>

                          <strong className="text-navy">
                            KSh{" "}
                            {numericAmount.toLocaleString()}
                          </strong>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm text-slate">
                            Balance after payment
                          </span>

                          <strong
                            className={
                              remainingBalance ===
                              0
                                ? "text-green-600"
                                : "text-orange"
                            }
                          >
                            KSh{" "}
                            {remainingBalance.toLocaleString()}
                          </strong>
                        </div>

                        {isFullPayment && (
                          <p className="mt-3 text-xs font-medium text-green-600">
                            ✓ This will complete the full trip payment.
                          </p>
                        )}
                      </div>
                    )}

                  {/* Error */}
                  {error && (
                    <div className="flex gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                      <p>
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Confirming Payment */}
                  {checkingPayment && (
                    <div className="rounded-xl bg-orange/5 p-5 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange" />

                      <p className="mt-3 font-semibold text-navy">
                        Confirming your payment...
                      </p>

                      <p className="mt-1 text-sm leading-5 text-slate-light">
                        Please wait while we confirm your M-Pesa transaction.
                      </p>

                      <p className="mt-3 text-xs font-medium text-orange">
                        Do not make another payment.
                      </p>
                    </div>
                  )}

                  {/* M-Pesa Security */}
                  {!checkingPayment && (
                    <div className="rounded-xl border border-slate/10 bg-slate/5 p-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange" />

                        <div>
                          <p className="text-sm font-semibold text-navy">
                            Secure M-Pesa Payment
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-light">
                            Your M-Pesa PIN is entered only on your phone and is never shared on our website.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                {!checkingPayment && (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      className="flex-1"
                      onClick={
                        handlePayment
                      }
                      disabled={
                        loading
                      }
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                          Sending Prompt...
                        </>
                      ) : (
                        "Pay with M-Pesa"
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      className="flex-1"
                      onClick={
                        handleClose
                      }
                      disabled={
                        loading
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}