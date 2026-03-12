import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PropertyGalleryProps {
  images: string[];
}

const PropertyGallery = ({ images }: PropertyGalleryProps) => {
  const [current, setCurrent] = useState(0);
  const maxThumbs = 5;
  const remaining = images.length - maxThumbs;

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  return (
    <div className="relative w-full">
      {/* Main image */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-muted">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={images[current]}
            alt={`Foto ${current + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
          aria-label="Foto anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
          aria-label="Próxima foto"
        >
          <ChevronRight size={20} />
        </button>

        {/* Counter */}
        <div className="absolute bottom-4 right-4 text-body text-xs tracking-wider bg-background/60 backdrop-blur-sm px-3 py-1.5 rounded-sm text-foreground">
          {current + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 mt-2 px-4 md:px-0">
        {images.slice(0, maxThumbs).map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`relative flex-1 aspect-[4/3] overflow-hidden rounded-sm transition-all duration-300 ${
              current === i
                ? "ring-2 ring-primary opacity-100"
                : "opacity-60 hover:opacity-90"
            }`}
          >
            <img
              src={img}
              alt={`Miniatura ${i + 1}`}
              className="w-full h-full object-cover"
            />
            {/* "+N ver todas" overlay on last visible thumbnail */}
            {i === maxThumbs - 1 && remaining > 0 && (
              <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                <span className="text-body text-sm font-medium text-primary-foreground">
                  +{remaining} fotos
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PropertyGallery;
