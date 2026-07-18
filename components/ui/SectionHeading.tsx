"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SectionHeadingProps {
  label?: string;
  title?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export default function SectionHeading({
  label,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  const heading = title || label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className={cn(
        "mb-8 lg:mb-10", // Reduced bottom spacing
        align === "center" && "mx-auto max-w-3xl text-center",
        align === "left" && "text-left",
        className
      )}
    >
      {heading && (
        <h2 className="font-display text-[1.35rem] sm:text-[1.8rem] lg:text-[2.15rem] font-bold uppercase tracking-[0.08em] text-orange leading-tight">
          {heading}
        </h2>
      )}

      {description && (
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-light sm:text-base">
          {description}
        </p>
      )}
    </motion.div>
  );
}