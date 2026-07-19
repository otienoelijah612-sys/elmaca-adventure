import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/layout/FloatingWhatsApp";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import WhyChoose from "@/components/sections/WhyChoose";
import UpcomingAdventures from "@/components/sections/UpcomingAdventures";
import Gallery from "@/components/sections/Gallery";
import Merchandise from "@/components/sections/Merchandise";
import Testimonials from "@/components/sections/Testimonials";
import JoinCommunity from "@/components/sections/JoinCommunity";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <WhyChoose />
        <UpcomingAdventures />
        <Gallery />
        <Merchandise />
        <Testimonials />
        <JoinCommunity />
        <Contact />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}