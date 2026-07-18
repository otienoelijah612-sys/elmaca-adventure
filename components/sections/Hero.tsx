"use client";

import Button from "@/components/ui/Button";
import { SECTION_IDS } from "@/lib/constants";
import { heroStats } from "@/lib/data";
import { scrollToSection } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  const handleScrollToAdventures = () => scrollToSection(SECTION_IDS.adventures);

  return (
    <section
      id={SECTION_IDS.home}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      <Image
        src="/images/hero.jpg"
        alt="Kenyan mountain adventure landscape"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/50 to-navy/80" />

      <div className="container-custom relative z-10 px-4 pt-24 pb-16 text-center sm:px-6 lg:px-8">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-orange sm:text-base">
            Elmaca Adventure
          </p>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Explore Kenya &amp; The World Differently
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-white/85 sm:text-xl">
            Road Trips • Adventures • Outdoor Experiences
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" onClick={handleScrollToAdventures}>
              Reserve Your Slot
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={handleScrollToAdventures}
            >
              Explore Adventures
            </Button>
          </div>
        </div>

        {/* Hero Stats */}
        <div className="mt-10 flex justify-center gap-3 overflow-x-auto pb-2">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="min-w-[95px] rounded-xl border border-white/20 bg-black/50 px-3 py-3 backdrop-blur-lg"
            >
              <p className="font-display text-xl font-bold text-white">
                {stat.value}
              </p>

              <p className="mt-1 text-[11px] leading-tight text-white/75">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => scrollToSection(SECTION_IDS.about)}
          className="mt-10 inline-flex flex-col items-center gap-1 text-white/70 transition-colors hover:text-white"
          aria-label="Scroll to about section"
        >
          <span className="text-xs uppercase tracking-widest">
            Discover
          </span>

          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </div>
    </section>
  );
}