import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Preloader from "@/components/Preloader";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SearchBarSection from "@/components/SearchBarSection";
import NewArrivalsSection from "@/components/NewArrivalsSection";
import PropertyCarouselSection from "@/components/PropertyCarouselSection";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import FeaturedPropertySection from "@/components/FeaturedPropertySection";
import LifestyleSection from "@/components/LifestyleSection";
import InstitutionalSection from "@/components/InstitutionalSection";
import TeamSection from "@/components/TeamSection";
import ContactSection from "@/components/ContactSection";
import AlphavilleMapSection from "@/components/AlphavilleMapSection";
import Footer from "@/components/Footer";

const PRELOADER_KEY = "preloader_seen";

const Index = () => {
  const [alreadySeen] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem(PRELOADER_KEY) === "1"
  );
  const [loaded, setLoaded] = useState(alreadySeen);
  const handleComplete = useCallback(() => {
    try { localStorage.setItem(PRELOADER_KEY, "1"); } catch {}
    setLoaded(true);
  }, []);
  const location = useLocation();

  const { data: carousel1 } = useSiteSettings<{ title: string; property_ids: string[]; is_active: boolean }>("homepage_carousel_2");
  const { data: carousel2 } = useSiteSettings<{ title: string; property_ids: string[]; is_active: boolean }>("homepage_carousel_3");

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
          <FeaturedPropertySection />
          <InstitutionalSection />
          <TeamSection />
          <AlphavilleMapSection />
          {carousel1?.is_active && (
            <PropertyCarouselSection 
              title={carousel1.title} 
              propertyIds={carousel1.property_ids || []} 
            />
          )}
          {carousel2?.is_active && (
            <PropertyCarouselSection 
              title={carousel2.title} 
              propertyIds={carousel2.property_ids || []} 
            />
          )}
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
