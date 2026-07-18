"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { SECTION_IDS } from "@/lib/constants";
import { Compass, Sparkles, Target } from "lucide-react";

const aboutItems = [
  {
    icon: Compass,
    title: "Who We Are",
    content:
      "Connecting people through unforgettable road trips and outdoor experiences across Kenya.",
  },
  {
    icon: Target,
    title: "Mission",
    content:
      "Inspiring people to explore, connect and create lasting memories together.",
  },
  {
    icon: Sparkles,
    title: "Why Elmaca",
    content:
      "Safe, affordable and professionally organized adventures with amazing people.",
  },
];

export default function About() {
  return (
    <section
      id={SECTION_IDS.about}
      className="bg-white py-8 lg:section-padding"
    >
      <div className="container-custom">
        <SectionHeading
          label="About Us"
          title=""
          description=""
        />

        <div className="mx-auto max-w-3xl rounded-3xl border border-slate/10 bg-white card-shadow p-4 sm:p-5 lg:p-8">
          <div className="space-y-4">
            {aboutItems.map((item, index) => (
              <div key={item.title}>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
                    <item.icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-display text-sm md:text-base font-semibold text-navy">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-xs md:text-sm leading-relaxed text-slate-light">
                      {item.content}
                    </p>
                  </div>
                </div>

                {index < aboutItems.length - 1 && (
                  <div className="mt-4 border-b border-slate/10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}