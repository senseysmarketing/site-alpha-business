import { MessageCircle } from "lucide-react";

export default function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/5511993116849"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-bordeaux shadow-lg ring-1 ring-bordeaux/20 transition-transform duration-300 hover:scale-110 hover:shadow-xl"
    >
      <MessageCircle className="h-6 w-6 text-background" strokeWidth={2} />
    </a>
  );
}
