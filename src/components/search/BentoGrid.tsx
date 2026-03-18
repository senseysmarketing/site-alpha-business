import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PropertyCard from "./PropertyCard";

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
  bedrooms: number | null;
  bathrooms: number | null;
  area_total: number | null;
  photo: string | null;
  relevance_reason: string;
}

interface BentoGridProps {
  results: SearchResult[];
  compareIds: string[];
  onToggleCompare: (id: string) => void;
}

const BentoGrid = ({ results, compareIds, onToggleCompare }: BentoGridProps) => {
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
        stagger: 0.12,
        duration: 0.7,
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

  // Build bento layout pattern: first=wide, next 2-3=grid, repeat
  const rows: { items: SearchResult[]; pattern: "wide" | "grid" }[] = [];
  let i = 0;

  while (i < results.length) {
    // First item or every 4th chunk: wide
    if (i === 0 || rows.length % 2 === 0) {
      rows.push({ items: [results[i]], pattern: "wide" });
      i++;
    } else {
      // Next 2-3 items in grid
      const chunk = results.slice(i, i + 3);
      rows.push({ items: chunk, pattern: "grid" });
      i += chunk.length;
    }
  }

  return (
    <div ref={gridRef} className="space-y-4 md:space-y-6">
      {rows.map((row, rowIdx) => {
        if (row.pattern === "wide") {
          return (
            <div key={rowIdx} data-card>
              <PropertyCard
                property={row.items[0]}
                isWide
                isSelected={compareIds.includes(row.items[0].id)}
                onToggleCompare={onToggleCompare}
              />
            </div>
          );
        }

        return (
          <div
            key={rowIdx}
            className={`grid gap-4 md:gap-6 ${
              row.items.length === 3
                ? "grid-cols-1 md:grid-cols-3"
                : row.items.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {row.items.map((item) => (
              <div key={item.id} data-card>
                <PropertyCard
                  property={item}
                  isSelected={compareIds.includes(item.id)}
                  onToggleCompare={onToggleCompare}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default BentoGrid;
