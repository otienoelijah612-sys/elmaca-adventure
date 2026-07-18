"use client";

import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Copy, Smartphone, X } from "lucide-react";
import { useCallback, useState } from "react";
import Button from "./Button";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  adventureTitle?: string;
}

export default function BookingModal({
  isOpen,
  onClose,
  adventureTitle,
}: BookingModalProps) {
  const [copied, setCopied] = useState(false);

  const copyTill = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SITE.mpesaTill);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[90vh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-light transition-colors hover:bg-slate/5 hover:text-navy"
              aria-label="Close booking instructions"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange/10">
              <Smartphone className="h-7 w-7 text-orange" />
            </div>

            <h3
              id="booking-modal-title"
              className="font-display text-2xl font-semibold text-navy"
            >
              Book Your Slot
            </h3>
            {adventureTitle && (
              <p className="mt-1 text-sm text-slate-light">{adventureTitle}</p>
            )}

            <div className="mt-6 space-y-4">
              <p className="text-slate">
                Complete your booking via M-Pesa using the details below:
              </p>

              <div className="rounded-xl border border-slate/10 bg-slate/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-light">
                  Payment Method
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-navy">
                  M-Pesa Buy Goods
                </p>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-white p-4 card-shadow">
                  <div>
                    <p className="text-xs text-slate-light">Till Number</p>
                    <p className="font-display text-2xl font-bold tracking-wide text-navy">
                      {SITE.mpesaTill}
                    </p>
                  </div>
                  <button
                    onClick={copyTill}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      copied
                        ? "bg-green-50 text-green-600"
                        : "bg-navy/5 text-navy hover:bg-navy/10",
                    )}
                    aria-label="Copy till number"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <ol className="space-y-3 text-sm text-slate">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange/10 text-xs font-bold text-orange">
                    1
                  </span>
                  Open M-Pesa on your phone and select <strong>Buy Goods</strong>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange/10 text-xs font-bold text-orange">
                    2
                  </span>
                  Enter Till Number <strong>{SITE.mpesaTill}</strong>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange/10 text-xs font-bold text-orange">
                    3
                  </span>
                  Enter the adventure amount and confirm payment
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange/10 text-xs font-bold text-orange">
                    4
                  </span>
                  Send your M-Pesa confirmation to us on WhatsApp
                </li>
              </ol>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1"
                onClick={() => {
                  window.open(
                    `https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Hi Elmaca Adventure! I'd like to confirm my booking${adventureTitle ? ` for ${adventureTitle}` : ""}.`,
                    )}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                Confirm on WhatsApp
              </Button>
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
