import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Images } from "lucide-react";
import VideoTourModal from "./VideoTourModal";
import PhotoLightbox from "./PhotoLightbox";

interface PropertyGalleryProps {
  images: string[];
  videoUrl?: string;
}

const PropertyGallery = ({ images, videoUrl }: PropertyGalleryProps) => {
  const [videoOpen, setVideoOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      {/* Desktop hero grid */}
      <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-1.5 h-[70vh] max-h-[680px]">
        {/* Main large image */}
        <motion.div
          layoutId="property-hero"
          className="col-span-2 row-span-2 relative overflow-hidden cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          <img
            src={images[0]}
            alt="Foto principal"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Video tour button */}
          {videoUrl && (
            <button
              onClick={(e) => { e.stopPropagation(); setVideoOpen(true); }}
              className="absolute bottom-8 left-6 flex items-center gap-2.5 px-5 py-2.5 glass-panel text-body text-xs tracking-[0.1em] uppercase text-foreground hover:bg-background/90 transition-colors rounded-full"
            >
              <Play size={14} strokeWidth={1.5} />
              Assistir Tour em Vídeo
            </button>
          )}
        </motion.div>

        {/* Top right image */}
        <div
          className="relative overflow-hidden cursor-pointer group"
          onClick={() => openLightbox(1)}
        >
          <img
            src={images[1] || images[0]}
            alt="Foto 2"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        {/* Bottom right image */}
        <div
          className="relative overflow-hidden cursor-pointer group"
          onClick={() => openLightbox(2)}
        >
          <img
            src={images[2] || images[0]}
            alt="Foto 3"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Explore all photos button */}
          {images.length > 3 && (
            <button
              onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 glass-panel text-body text-[11px] tracking-[0.1em] uppercase text-foreground hover:bg-background/90 transition-colors rounded-full"
            >
              <Images size={14} strokeWidth={1.5} />
              Explorar todas as fotos
            </button>
          )}
        </div>
      </div>

      {/* Mobile: single image with dots */}
      <div className="md:hidden relative aspect-[4/3] overflow-hidden">
        <img
          src={images[0]}
          alt="Foto principal"
          className="w-full h-full object-cover"
          onClick={() => openLightbox(0)}
        />

        {videoUrl && (
          <button
            onClick={() => setVideoOpen(true)}
            className="absolute bottom-14 right-4 flex items-center gap-2 px-4 py-2 glass-panel text-body text-[10px] tracking-[0.1em] uppercase text-foreground rounded-full"
          >
            <Play size={12} strokeWidth={1.5} />
            Tour em Vídeo
          </button>
        )}

        <button
          onClick={() => openLightbox(0)}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 glass-panel text-body text-[10px] tracking-[0.1em] uppercase text-foreground rounded-full"
        >
          <Images size={12} strokeWidth={1.5} />
          {images.length} fotos
        </button>
      </div>

      {/* Modals */}
      {videoUrl && (
        <VideoTourModal open={videoOpen} onOpenChange={setVideoOpen} videoUrl={videoUrl} />
      )}
      <PhotoLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={images}
        initialIndex={lightboxIndex}
      />
    </>
  );
};

export default PropertyGallery;
