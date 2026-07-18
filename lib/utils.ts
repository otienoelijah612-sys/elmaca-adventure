export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function scrollToSection(id: string): void {
  const element = document.getElementById(id);
  if (element) {
    const offset = 80;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

export function openWhatsApp(phone: string, message?: string): void {
  const cleaned = phone.replace(/\D/g, "");
  const url = message
    ? `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${cleaned}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function formatPhoneDisplay(phone: string): string {
  return phone;
}
