export interface Adventure {
  id: string;
  title: string;
  date: string;
  destination: string;
  price: string;
  remainingSlots: number;
  description: string;
  image: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  image: string;
}

export const adventures: Adventure[] = [];

export const galleryImages: GalleryImage[] = [
  {
    id: "1",
    src: "/images/gallery/cedella.jpg",
    alt: "Elmaca Adventure member",
  },
  {
    id: "2",
    src: "/images/gallery/group photo 1.jpg",
    alt: "Elmaca Adventure group photo",
  },
  {
    id: "3",
    src: "/images/gallery/group-photo-2.jpg",
    alt: "Adventure group experience",
  },
  {
    id: "4",
    src: "/images/gallery/group photo 3.jpg",
    alt: "Adventure memories",
  },
  {
    id: "5",
    src: "/images/gallery/lake.jpg",
    alt: "Lake adventure",
  },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Round Neck T-Shirt",
    description:
      "Premium cotton tee featuring the Elmaca Adventure logo. Comfortable, breathable, and perfect for every expedition.",
    price: "KSh 700",
    image: "/merchandise/round-neck-t-shirt.png"
  },
  {
    id: "2",
    name: "Polo T-Shirt",
    description:
      "Classic polo with embroidered branding. Smart casual style for adventures and everyday wear.",
    price: "KSh 1,000",
  image: "/merchandise/polo-t-shirt.png"
  },
];
export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Fred",
    text: "The Kit Mikayi adventure was unforgettable. From the breathtaking views to the amazing people I met, every moment was worth it. Elmaca Adventure made the experience fun, safe, and well organized. I can't wait for the next trip!",
    rating: 5,
    image: "",
  },
  {
    id: "2",
    name: "Cate",
    text: "Exploring Kakamega Forest with Elmaca Adventure was an incredible experience. The beautiful scenery, fresh air, and great company made the trip unforgettable. Every adventure leaves you with wonderful memories and new friendships.",
    rating: 5,
    image: "",
  },
  {
    id: "3",
    name: "Cedella",
    text: "Palm Beach Uhendo was the perfect escape. The atmosphere, the fun activities, and the friendships we created made it an experience I'll always remember. Elmaca Adventure truly knows how to create memorable adventures.",
    rating: 5,
    image: "",
  },
];

export const whyChooseFeatures = [
  {
    title: "Professionally Organized Trips",
    description:
      "Every detail handled — transport, accommodation, and activities.",
    icon: "compass" as const,
  },
  {
    title: "Safety First",
    description:
      "Certified guides and safety-first protocols on every adventure.",
    icon: "shield" as const,
  },
  {
    title: "Meaningful Networking",
    description:
      "Connect with like-minded explorers and build genuine connections.",
    icon: "users" as const,
  },
  {
    title: "Affordable Adventures",
    description:
      "Premium experiences at prices that make exploration accessible.",
    icon: "wallet" as const,
  },
];

export const heroStats = [
  { value: "100+", label: "Happy Explorers" },
  { value: "98%", label: "Satisfaction" },
  { value: "15+", label: "Destinations" },
];