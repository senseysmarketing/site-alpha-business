import { X } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay, DialogContent } from "@/components/ui/dialog";

interface VideoTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
}

const VideoTourModal = ({ open, onOpenChange, videoUrl }: VideoTourModalProps) => {
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYoutubeId(videoUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[60] bg-black/90 backdrop-blur-xl" />
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/20 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
          
          <div className="w-full max-w-5xl aspect-video rounded-sm overflow-hidden bg-black">
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title="Video Tour"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            )}
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
};

export default VideoTourModal;
