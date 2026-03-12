import { useState, useCallback } from "react";
import Preloader from "@/components/Preloader";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import LifestyleSection from "@/components/LifestyleSection";
import FeaturedPropertySection from "@/components/FeaturedPropertySection";
import NewArrivalsSection from "@/components/NewArrivalsSection";
import ContactSection from "@/components/ContactSection";
import AlphavilleMapSection from "@/components/AlphavilleMapSection";
import InstitutionalSection from "@/components/InstitutionalSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [loaded, setLoaded] = useState(false);
  const handleComplete = useCallback(() => setLoaded(true), []);

  return (
    <>
      <Preloader onComplete={handleComplete} />
      <div
        className="transition-opacity duration-700 ease-out"
        style={{ opacity: loaded ? 1 : 0 }}
      >
        <Header />
        <main>
          <HeroSection />
          <LifestyleSection />
          <FeaturedPropertySection />
          <NewArrivalsSection />
          <AlphavilleMapSection />
          <ContactSection />
          <InstitutionalSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;