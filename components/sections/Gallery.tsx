"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { SECTION_IDS } from "@/lib/constants";
import { galleryImages } from "@/lib/data";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export default function Gallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % galleryImages.length : null,
    );
  }, []);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null
        ? (prev - 1 + galleryImages.length) % galleryImages.length
        : null,
    );
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;

      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, closeLightbox, goNext, goPrev]);

  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  return (
    <section
      id={SECTION_IDS.gallery}
      className="section-padding bg-slate/[0.03]"
    >
      <div className="container-custom">
      <SectionHeading
  label="Moments From Our Adventures"
  title=""
  description=""
/>

        {/* Desktop */}
        <div className="hidden gap-4 lg:grid lg:grid-cols-3">
          {/* Portrait */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setLightboxIndex(0)}
            className="group relative row-span-2 overflow-hidden rounded-2xl"
          >
            <div className="relative aspect-[3/4]">
              <Image
                src={galleryImages[0].src}
                alt={galleryImages[0].alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
              <ZoomIn className="h-8 w-8 text-white opacity-0 transition group-hover:opacity-100" />
            </div>
          </motion.button>

          {/* Remaining Photos */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {galleryImages.slice(1).map((image, index) => (
              <motion.button
                key={image.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setLightboxIndex(index + 1)}
                className={`group relative overflow-hidden rounded-2xl ${
                  index === 3 ? "col-span-2" : ""
                }`}
              >
                <div
                  className={`relative ${
                    index === 3 ? "aspect-[16/8]" : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 transition group-hover:opacity-100" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div className="grid gap-4 lg:hidden">
          {galleryImages.map((image, index) => (
            <motion.button
              key={image.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setLightboxIndex(index)}
              className="group relative overflow-hidden rounded-2xl"
            >
              <div
                className={`relative ${
                  index === 0 ? "aspect-[3/4]" : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                <ZoomIn className="h-8 w-8 text-white opacity-0 transition group-hover:opacity-100" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-5 hidden rounded-full bg-white/10 px-4 py-3 text-white hover:bg-white/20 md:block"
            >
              &#8592;
            </button>

            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative h-[80vh] w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={galleryImages[lightboxIndex].src}
                alt={galleryImages[lightboxIndex].alt}
                fill
                priority
                className="object-contain"
              />
            </motion.div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-5 hidden rounded-full bg-white/10 px-4 py-3 text-white hover:bg-white/20 md:block"
            >
              &#8594;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}