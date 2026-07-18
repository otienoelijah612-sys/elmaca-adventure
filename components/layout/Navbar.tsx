"use client";

import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { NAV_LINKS, SECTION_IDS } from "@/lib/constants";
import { scrollToSection } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useCallback, useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = useCallback((href: string) => {
    setMobileOpen(false);
    scrollToSection(href.replace("#", ""));
  }, []);

  const handleReserve = useCallback(() => {
    setMobileOpen(false);
    scrollToSection(SECTION_IDS.adventures);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0A1628]/95 shadow-lg backdrop-blur-md">
      <nav
        className="container-custom flex h-[72px] items-center justify-between px-5 lg:px-0"
        aria-label="Main navigation"
      >
        <button
          onClick={() => handleNavClick("#home")}
          className="relative z-50"
          aria-label="Go to home"
        >
          <Logo />
        </button>

        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-sm font-medium text-white transition hover:text-orange"
            >
              {link.label}
            </button>
          ))}

          <Button size="sm" onClick={handleReserve}>
            Reserve Your Slot
          </Button>
        </div>

        <button
          className="relative z-50 rounded-lg p-2 text-white lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="h-7 w-7" />
          ) : (
            <Menu className="h-7 w-7" />
          )}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 top-[72px] border-b border-white/10 bg-[#0A1628] shadow-xl lg:hidden"
          >
            <div className="flex flex-col gap-2 p-5">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="rounded-lg px-4 py-3 text-left text-white transition hover:bg-white/10 hover:text-orange"
                >
                  {link.label}
                </button>
              ))}

              <Button className="mt-3 w-full" onClick={handleReserve}>
                Reserve Your Slot
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}