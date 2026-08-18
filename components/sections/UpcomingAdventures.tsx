"use client";

import { useState } from "react";
import Image from "next/image";

import BookingModal from "@/components/ui/BookingModal";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";

import {
  SECTION_IDS,
  WHATSAPP_COMMUNITY_URL,
} from "@/lib/constants";

import { adventures, type Adventure } from "@/lib/data";

function AdventureCard({
  adventure,
  onBook,
}: {
  adventure: Adventure;
  onBook: (adventure: Adventure) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <article className="w-full overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Event Poster */}
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="group relative block w-full cursor-pointer"
          aria-label={`View ${adventure.title} poster`}
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src={adventure.image}
              alt={adventure.title}
              fill
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 500px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />

            {/* Desktop hover effect */}
            <div className="absolute inset-0 hidden items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30 sm:flex">
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                🔍 View Poster
              </span>
            </div>
          </div>
        </button>

        {/* Price + Booking Button */}
        <div className="flex w-full items-center justify-between gap-4 p-4 sm:p-5">
          <p className="shrink-0 text-xl font-bold text-navy sm:text-2xl">
            {adventure.price}
          </p>

          <Button
            size="sm"
            onClick={() => onBook(adventure)}
          >
            Book Your Slot
          </Button>
        </div>
      </article>

      {/* Full-Screen Poster Preview */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          onClick={() => setPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${adventure.title} poster preview`}
        >
          <div
            className="relative flex h-full w-full max-w-5xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute right-0 top-0 z-10 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:right-2 sm:top-2"
            >
              ✕ Close
            </button>

            {/* Large Poster */}
            <div className="relative h-[90vh] w-full">
              <Image
                src={adventure.image}
                alt={adventure.title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function UpcomingAdventures() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedAdventure, setSelectedAdventure] =
    useState<Adventure | null>(null);

  const handleBook = (adventure: Adventure) => {
    setSelectedAdventure(adventure);
    setBookingOpen(true);
  };

  /*
   * If there are no upcoming adventures,
   * show the "Coming Soon" message.
   */
  if (adventures.length === 0) {
    return (
      <section
        id={SECTION_IDS.adventures}
        className="section-padding w-full bg-white"
      >
        <div className="container-custom w-full">
          <SectionHeading
            label=""
            title="Upcoming Adventures"
            description=""
          />

          <div className="mx-auto w-full max-w-2xl">
            <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-xl">
              <div className="mb-5 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange/10">
                  <div className="text-2xl">🧭</div>
                </div>
              </div>

              <h3 className="font-display text-2xl font-semibold text-navy">
                The Next Adventure Is Coming Soon
              </h3>

              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-light">
                Stay connected and be the first to know when bookings open.
              </p>

              <div className="mt-8">
                <a
                  href={WHATSAPP_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button>
                    Join WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /*
   * Currently Elmaca has one upcoming adventure.
   * The layout is intentionally simple and responsive.
   */
  const adventure: Adventure = adventures[0];

  // Convert the displayed price, e.g.
  // "KSh 2,599" → 2599
  const adventurePrice = Number(
    adventure.price.replace(/[^0-9]/g, ""),
  );

  return (
    <section
      id={SECTION_IDS.adventures}
      className="section-padding w-full bg-white"
    >
      <div className="container-custom w-full">
        <SectionHeading
          label=""
          title="Upcoming Adventures"
          description=""
        />

        {/* Responsive Adventure Card */}
        <div className="mx-auto w-full max-w-md">
          <AdventureCard
            adventure={adventure}
            onBook={handleBook}
          />
        </div>
      </div>

      {/* Booking Modal */}
      {selectedAdventure && (
        <BookingModal
          isOpen={bookingOpen}
          onClose={() => {
            setBookingOpen(false);
            setSelectedAdventure(null);
          }}
          adventureTitle={selectedAdventure.title}
          adventurePrice={adventurePrice}
        />
      )}
    </section>
  );
}