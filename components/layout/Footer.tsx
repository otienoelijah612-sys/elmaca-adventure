"use client";

import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { SITE, WHATSAPP_COMMUNITY_URL, NAV_LINKS } from "@/lib/constants";
import { scrollToSection } from "@/lib/utils";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/ui/SocialIcons";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white">
      <div className="container-custom section-padding pb-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo variant="light" />
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Bringing people together through road trips, outdoor experiences,
              and meaningful connections across Kenya and beyond.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white/90">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => scrollToSection(link.href.replace("#", ""))}
                    className="text-sm text-white/70 transition-colors hover:text-orange"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white/90">
              Contact
            </h3>
            <ul className="mt-4 space-y-3">
              {SITE.phones.map((phone) => (
                <li key={phone}>
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-orange"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {phone}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-orange"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <MapPin className="h-4 w-4 shrink-0" />
                {SITE.location}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white/90">
              Connect
            </h3>
            <div className="mt-4 flex gap-3">
              <a
                href={SITE.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-orange"
                aria-label="TikTok"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
              <a
                href={SITE.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-orange"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-orange"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            </div>
            <Button
              size="sm"
              className="mt-6 w-full sm:w-auto"
              onClick={() =>
                window.open(WHATSAPP_COMMUNITY_URL, "_blank", "noopener,noreferrer")
              }
            >
              Join Group Community
            </Button>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-white/50">
          &copy; {currentYear} Elmaca Adventure. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
