import { useLocation } from "react-router-dom";
import whatsappIcon from "@/assets/whatsapp-icon.png.asset.json";
import { trackContact } from "@/lib/metaPixel";

export default function FloatingWhatsApp() {
  const { pathname } = useLocation();

  // Esconder em rotas privadas (admin/login)
  if (pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/imovel")) {
    return null;
  }

  return (
    <a
      href="https://wa.me/5511993116849"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      onClick={() => trackContact({ content_name: "WhatsApp Flutuante" })}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-bordeaux shadow-lg ring-1 ring-bordeaux/20 transition-transform duration-300 hover:scale-110 hover:shadow-xl"
    >
      <img
        src={whatsappIcon.url}
        alt=""
        aria-hidden="true"
        className="h-7 w-7"
        style={{ filter: "brightness(0) invert(1)" }}
      />
    </a>
  );
}
