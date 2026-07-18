"use client";

import BookingModal from "@/components/ui/BookingModal";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import {
  SECTION_IDS,
  WHATSAPP_COMMUNITY_URL,
} from "@/lib/constants";
import { adventures, type Adventure } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  PanInfo,
  useMotionValue,
} from "framer-motion";
import { Compass } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

function AdventureCard({
  adventure,
  onBook,
}: {
  adventure: Adventure;
  onBook: (title: string) => void;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white card-shadow sm:rounded-2xl">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={adventure.image}
          alt={adventure.title}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 768px) 100vw, 400px"
        />
      </div>

      <div className="flex flex-1 items-center justify-between gap-3 p-4 sm:p-6">
        <p className="font-display text-xl font-bold text-navy sm:text-2xl">
          {adventure.price}
        </p>

        <Button size="sm" onClick={() => onBook(adventure.title)}>
          Book Your Slot
        </Button>
      </div>
    </article>
  );
}

export default function UpcomingAdventures() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedAdventure, setSelectedAdventure] = useState<string>();
  const dragX = useMotionValue(0);

  if (adventures.length === 0) {
    return (
      <section
        id={SECTION_IDS.adventures}
        className="section-padding bg-white"
      >
        <div className="container-custom">
          <SectionHeading
            label=""
            title="Upcoming Adventures"
            description=""
          />

          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl bg-white card-shadow px-6 py-12 text-center">
              <div className="mb-5 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange/10">
                  <Compass className="h-7 w-7 text-orange" />
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

  const slideCount = adventures.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(((index % slideCount) + slideCount) % slideCount);
    },
    [slideCount],
  );

  const next = useCallback(
    () => goTo(currentIndex + 1),
    [currentIndex, goTo],
  );

  const prev = useCallback(
    () => goTo(currentIndex - 1),
    [currentIndex, goTo],
  );

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 50;

    if (info.offset.x < -threshold) next();
    else if (info.offset.x > threshold) prev();

    dragX.set(0);
  };

  const handleBook = (title: string) => {
    setSelectedAdventure(title);
    setBookingOpen(true);
  };

  const visibleIndices = [
    (currentIndex - 1 + slideCount) % slideCount,
    currentIndex,
    (currentIndex + 1) % slideCount,
  ];
  return (
    <section id={SECTION_IDS.adventures} className="section-padding bg-white">
      <div className="container-custom">
        <SectionHeading
          label=""
          title="Upcoming Adventures"
          description=""
        />

        <div className="relative mx-auto max-w-5xl">
          {/* Desktop */}
          <div className="hidden gap-6 lg:grid lg:grid-cols-3">
            {visibleIndices.map((idx) => (
              <motion.div
                key={`desktop-${adventures[idx].id}-${idx}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  idx !== currentIndex && "opacity-80 lg:opacity-100",
                )}
              >
                <AdventureCard
                  adventure={adventures[idx]}
                  onBook={handleBook}
                />
              </motion.div>
            ))}
          </div>

          {/* Mobile & Tablet */}
          <div className="overflow-hidden lg:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                style={{ x: dragX }}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="cursor-grab active:cursor-grabbing"
              >
                <AdventureCard
                  adventure={adventures[currentIndex]}
                  onBook={handleBook}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {adventures.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  idx === currentIndex
                    ? "w-8 bg-orange"
                    : "w-2 bg-slate/20 hover:bg-slate/40",
                )}
                aria-label={`Go to adventure ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        adventureTitle={selectedAdventure}
      />
    </section>
  );
}