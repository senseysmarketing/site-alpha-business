import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";

interface PhotoLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  initialIndex?: number;
}

const PhotoLightbox = ({ open, onOpenChange, images, initialIndex = 0 }: PhotoLightboxProps) => {
  const [current, setCurrent] = useState(initialIndex);

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/95 backdrop-blur-xl" />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Close */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/20 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>

          {/* Counter */}
          <div className="absolute top-6 left-6 text-primary-foreground/70 text-body text-sm tracking-wider">
            {current + 1} / {images.length}
          </div>

          {/* Prev */}
          <button
            onClick={prev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/20 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Image */}
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={images[current]}
              alt={`Foto ${current + 1}`}
              className="max-w-[85vw] max-h-[85vh] object-contain rounded-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>

          {/* Next */}
          <button
            onClick={next}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/20 transition-colors"
            aria-label="Próxima"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </DialogPortal>
    </Dialog>
  );
};

export default PhotoLightbox;
