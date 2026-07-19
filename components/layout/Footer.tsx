"use client";

import Logo from "@/components/ui/Logo";
import { SITE, NAV_LINKS } from "@/lib/constants";
import { scrollToSection } from "@/lib/utils";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/ui/SocialIcons";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white">
      <div className="container-custom section-padding pb-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          <div>
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
              Connect
            </h3>

            <p className="mt-4 text-sm text-white/70">
              Follow our journey on social media.
            </p>

            <div className="mt-5 flex gap-3">
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
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-white/50">
          &copy; {currentYear} Elmaca Adventure. All rights reserved.
        </div>
      </div>
    </footer>
  );
}