import { useState, useCallback } from "react";
import Preloader from "@/components/Preloader";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SearchBarSection from "@/components/SearchBarSection";
import NewArrivalsSection from "@/components/NewArrivalsSection";
import FeaturedPropertySection from "@/components/FeaturedPropertySection";
import InstitutionalSection from "@/components/InstitutionalSection";
import TeamSection from "@/components/TeamSection";
import ContactSection from "@/components/ContactSection";
import AlphavilleMapSection from "@/components/AlphavilleMapSection";
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
          <SearchBarSection />
          <NewArrivalsSection />
          <FeaturedPropertySection />
          <InstitutionalSection />
          <TeamSection />
          <ContactSection />
          <AlphavilleMapSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
