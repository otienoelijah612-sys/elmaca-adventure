"use client";

import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import { SITE, SECTION_IDS } from "@/lib/constants";
import { products } from "@/lib/data";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";

export default function Merchandise() {
  const handleOrder = (productName: string) => {
    const message = `Hi Elmaca Adventure! I'd like to order the ${productName}.`;

    window.open(
      `https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        message
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <section
      id={SECTION_IDS.merchandise}
      className="section-padding bg-white"
    >
      <div className="container-custom">
        <SectionHeading
          label="Elmaca Merchandise"
          title=""
          description=""
        />

        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2">
          {products.map((product, index) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="overflow-hidden rounded-2xl bg-white card-shadow"
            >
              {/* Product Mockup */}
              <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-white p-6">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  priority={product.id === "1"}
                  sizes="(max-width: 640px) 100vw, 450px"
                  className="object-contain p-4 transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Product Details */}
              <div className="p-6">
                <h3 className="font-display text-xl font-semibold text-navy">
                  {product.name}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-light">
                  {product.description}
                </p>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <p className="font-display text-xl font-bold text-navy">
                    {product.price}
                  </p>

                  <Button
                    size="sm"
                    onClick={() => handleOrder(product.name)}
                    className="gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Make an Order
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}