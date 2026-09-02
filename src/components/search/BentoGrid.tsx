import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PropertyCard, { type TransactionIntent } from "./PropertyCard";

gsap.registerPlugin(ScrollTrigger);

interface SearchResult {
  id: string;
  code: string;
  title: string;
  condominium: string | null;
  neighborhood: string | null;
  city: string | null;
  price: number | null;
  rental_price: number | null;
  transaction_type: string;
  property_type?: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spots?: number | null;
  area_total: number | null;
  photo: string | null;
  relevance_reason: string;
}

interface BentoGridProps {
  results: SearchResult[];
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  transactionIntent?: TransactionIntent;
}

const BentoGrid = ({ results, compareIds, onToggleCompare, transactionIntent }: BentoGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current || results.length === 0) return;

    const cards = gridRef.current.querySelectorAll("[data-card]");

    gsap.fromTo(
      cards,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 85%",
          once: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [results]);

  if (results.length === 0) return null;

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
    >
      {results.map((item) => (
        <div key={item.id} data-card className="h-full">
          <PropertyCard
            property={item}
            isSelected={compareIds.includes(item.id)}
            onToggleCompare={onToggleCompare}
            transactionIntent={transactionIntent}
          />
        </div>
      ))}
    </div>
  );
};

export default BentoGrid;
