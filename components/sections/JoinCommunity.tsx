"use client";

import Button from "@/components/ui/Button";
import { WHATSAPP_COMMUNITY_URL } from "@/lib/constants";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

export default function JoinCommunity() {
  return (
    <section className="section-padding bg-navy">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange/20">
            <MessageCircle className="h-8 w-8 text-orange" />
          </div>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Join Our Explorer Community
          </h2>
          <p className="mt-4 text-white/70">
          Join the Elmaca Adventure community and be the first to discover upcoming trips, exclusive experiences, and unforgettable adventures.
          </p>
          <Button
            size="lg"
            className="mt-8"
            onClick={() =>
              window.open(WHATSAPP_COMMUNITY_URL, "_blank", "noopener,noreferrer")
            }
          >
            Join Group Community
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
