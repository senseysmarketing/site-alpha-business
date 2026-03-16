import { X } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay, DialogContent } from "@/components/ui/dialog";

interface VideoTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
}

const VideoTourModal = ({ open, onOpenChange, videoUrl }: VideoTourModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/90 backdrop-blur-xl" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/20 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full max-w-5xl max-h-[85vh] rounded-sm"
          />
        </div>
      </DialogPortal>
    </Dialog>
  );
};

export default VideoTourModal;
