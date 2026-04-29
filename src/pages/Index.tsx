import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Preloader from "@/components/Preloader";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SearchBarSection from "@/components/SearchBarSection";
import NewArrivalsSection from "@/components/NewArrivalsSection";
import FeaturedPropertySection from "@/components/FeaturedPropertySection";
import LifestyleSection from "@/components/LifestyleSection";
import InstitutionalSection from "@/components/InstitutionalSection";
import TeamSection from "@/components/TeamSection";
import ContactSection from "@/components/ContactSection";
import AlphavilleMapSection from "@/components/AlphavilleMapSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [loaded, setLoaded] = useState(false);
  const handleComplete = useCallback(() => setLoaded(true), []);
  const location = useLocation();

  useEffect(() => {
    if (!loaded) return;
    const hash = location.hash?.replace("#", "");
    if (!hash) return;
    // Wait one frame so sections are mounted, then scroll.
    const t = window.setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [loaded, location.hash]);

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
          <LifestyleSection />
          <FeaturedPropertySection />
          <InstitutionalSection />
          <TeamSection />
          <AlphavilleMapSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
