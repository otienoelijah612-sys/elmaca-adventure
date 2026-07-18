"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { testimonials } from "@/lib/data";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-orange text-orange" : "fill-slate/10 text-slate/20"
          }`}
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="section-padding bg-slate/[0.03]">
      <div className="container-custom">
      <SectionHeading
  title="What Our Explorers Say"
/>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative rounded-2xl bg-white p-8 card-shadow"
            >
              <Quote className="absolute right-6 top-6 h-8 w-8 text-orange/15" />

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange text-lg font-bold text-white">
                  {testimonial.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()}
                </div>

                <div>
                  <h3 className="font-display font-semibold text-navy">
                    {testimonial.name}
                  </h3>
                  <StarRating rating={testimonial.rating} />
                </div>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-slate-light">
                &ldquo;{testimonial.text}&rdquo;
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}