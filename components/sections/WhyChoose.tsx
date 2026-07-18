"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { whyChooseFeatures } from "@/lib/data";
import { motion } from "framer-motion";
import {
  Compass,
  Heart,
  MapPin,
  Shield,
  Users,
  Wallet,
} from "lucide-react";

const iconMap = {
  compass: Compass,
  shield: Shield,
  users: Users,
  wallet: Wallet,
  "map-pin": MapPin,
  heart: Heart,
};

export default function WhyChoose() {
  return (
    <section className="bg-slate/[0.03] py-6 lg:section-padding">
      <div className="container-custom">
        <SectionHeading
          label="Why Elmaca"
          title=""
          description=""
        />

        <div className="grid grid-cols-2 gap-2 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {whyChooseFeatures.map((feature, index) => {
            const Icon = iconMap[feature.icon];

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="rounded-xl bg-white p-3 card-shadow transition-all duration-300 hover:shadow-lg flex flex-col items-center justify-center text-center min-h-[125px] md:min-h-[165px]"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="font-display text-[13px] md:text-base font-semibold leading-tight text-navy">
                  {feature.title}
                </h3>

                <p className="mt-1 text-[11px] md:text-sm leading-4 text-slate-light">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}