"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { SITE, SECTION_IDS } from "@/lib/constants";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/ui/SocialIcons";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";

const socialLinks = [
  { label: "TikTok", href: SITE.social.tiktok, icon: TikTokIcon },
  { label: "Facebook", href: SITE.social.facebook, icon: FacebookIcon },
  { label: "Instagram", href: SITE.social.instagram, icon: InstagramIcon },
];

export default function Contact() {
  return (
    <section id={SECTION_IDS.contact} className="section-padding bg-white">
      <div className="container-custom">
        <SectionHeading
          label="Contact"
          title="Get In Touch"
          description="Ready for your next adventure? Reach out — we'd love to hear from you."
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate/5 bg-white card-shadow"
        >
          <div className="grid md:grid-cols-2">
            <div className="bg-navy p-8 text-white sm:p-10">
              <h3 className="font-display text-2xl font-semibold">
                Contact Information
              </h3>
              <p className="mt-2 text-sm text-white/70">
                We&apos;re here to help you plan your next unforgettable journey.
              </p>

              <ul className="mt-8 space-y-6">
                <li>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Phone
                  </p>
                  <div className="mt-2 space-y-1">
                    {SITE.phones.map((phone) => (
                      <a
                        key={phone}
                        href={`tel:${phone}`}
                        className="flex items-center gap-2 text-sm transition-colors hover:text-orange"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        {phone}
                      </a>
                    ))}
                  </div>
                </li>
                <li>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Email
                  </p>
                  <a
                    href={`mailto:${SITE.email}`}
                    className="mt-2 flex items-center gap-2 text-sm transition-colors hover:text-orange"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    {SITE.email}
                  </a>
                </li>
                <li>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Location
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {SITE.location}
                  </p>
                </li>
              </ul>
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-10">
              <h3 className="font-display text-xl font-semibold text-navy">
                Follow Our Journey
              </h3>
              <p className="mt-2 text-sm text-slate-light">
                Stay connected and see the latest from our adventures.
              </p>

              <div className="mt-8 flex gap-4">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate/5 text-navy transition-all hover:bg-orange hover:text-white"
                    aria-label={label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>

              <div className="mt-10 rounded-xl bg-orange/5 p-5">
                <p className="text-sm font-medium text-navy">
                  Prefer WhatsApp?
                </p>
                <p className="mt-1 text-sm text-slate-light">
                  Tap the floating button or message us directly for quick
                  responses.
                </p>
                <a
                  href={`https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-orange hover:underline"
                >
                  Chat on WhatsApp &rarr;
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
