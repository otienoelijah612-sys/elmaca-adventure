"use client";

import { useState } from "react";
import BookingModal from "@/components/ui/BookingModal";

export default function PayPage() {
  const [isBookingOpen, setIsBookingOpen] =
    useState(false);

  return (
    <main className="min-h-screen bg-navy px-4 py-12 sm:px-6">
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
        <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl sm:p-12">
          {/* Header */}
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">
              Elmaca Adventure
            </p>

            <h1 className="mt-3 font-display text-3xl font-bold text-navy sm:text-4xl">
              Book Your Adventure
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate sm:text-base">
              Ready to join us? Book your slot and
              complete your payment securely through
              M-Pesa.
            </p>
          </div>

          {/* Booking shortcut */}
          <div className="mx-auto mt-8 max-w-md rounded-2xl bg-slate/5 p-6 text-center">
            <p className="font-semibold text-navy">
              Ready to book?
            </p>

            <p className="mt-2 text-sm leading-6 text-slate">
              Click below to open the booking form
              and secure your slot.
            </p>

            <button
              type="button"
              onClick={() =>
                setIsBookingOpen(true)
              }
              className="mt-6 w-full rounded-xl bg-orange px-6 py-4 font-semibold text-white shadow-lg transition hover:opacity-90"
            >
              Book Your Slot
            </button>
          </div>

          {/* Security note */}
          <p className="mt-7 text-center text-xs text-slate-light">
            Secure M-Pesa payment • Your PIN is
            entered only on your phone
          </p>

          <p className="mt-8 text-center text-xs text-slate-light">
            elmacaadventure.co.ke/pay
          </p>
        </div>
      </div>

      {/* Existing Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() =>
          setIsBookingOpen(false)
        }
        adventureTitle="Nandi Highlands Expedition"
        adventurePrice={2599}
      />
    </main>
  );
}