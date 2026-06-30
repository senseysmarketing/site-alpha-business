import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";

export default function FloatingScrollTop() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (pathname !== "/") return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      className={`hidden md:flex fixed bottom-6 left-6 z-40 h-14 w-14 items-center justify-center rounded-full bg-bordeaux shadow-lg ring-1 ring-bordeaux/20 transition-all duration-300 hover:scale-110 hover:shadow-xl ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      <ArrowUp className="h-7 w-7 text-white" strokeWidth={2.2} />
    </button>
  );
}
