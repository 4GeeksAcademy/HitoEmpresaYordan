import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { FooterSection } from "@/components/FooterSection";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <HeroSection ctaHref="#contacto" />
      <main>
        <ServicesSection />
        <AboutSection />
        <ContactSection />
      </main>
      <FooterSection />
    </div>
  );
}
