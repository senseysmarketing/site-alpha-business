import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SearchBarSection from "@/components/SearchBarSection";
import NewArrivalsSection from "@/components/NewArrivalsSection";
import PropertyCarouselSection from "@/components/PropertyCarouselSection";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import FeaturedPropertySection from "@/components/FeaturedPropertySection";
import InstitutionalSection from "@/components/InstitutionalSection";
import TeamSection from "@/components/TeamSection";
import ContactSection from "@/components/ContactSection";
import AlphavilleMapSection from "@/components/AlphavilleMapSection";
import Footer from "@/components/Footer";
import FloatingScrollTop from "@/components/FloatingScrollTop";

const Index = () => {
  const location = useLocation();

  const { data: carousel1 } = useSiteSettings<{ title: string; property_ids: string[]; is_active: boolean; cta?: import("@/lib/carouselCta").CarouselCta }>("homepage_carousel_2");
  const { data: carousel2 } = useSiteSettings<{ title: string; property_ids: string[]; is_active: boolean; cta?: import("@/lib/carouselCta").CarouselCta }>("homepage_carousel_3");

  useEffect(() => {
    const hash = location.hash?.replace("#", "");
    if (!hash) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [location.hash]);

  return (
    <>
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
            cta={carousel1.cta}
          />
        )}
        {carousel2?.is_active && (
          <PropertyCarouselSection
            title={carousel2.title}
            propertyIds={carousel2.property_ids || []}
            cta={carousel2.cta}
          />
        )}
        <ContactSection />
      </main>
      <Footer />
    </>
  );
};

export default Index;
