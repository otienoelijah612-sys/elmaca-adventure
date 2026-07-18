import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg">
        <Image
          src="/logo/logo.png"
          alt="Elmaca Adventure"
          width={44}
          height={44}
          priority
          className="object-contain"
        />
      </div>

      <div className="hidden sm:block">
        <h2 className="font-display text-xl font-bold text-white">
          Elmaca Adventure
        </h2>
      </div>
    </div>
  );
}