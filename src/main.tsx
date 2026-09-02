import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Static crawler-only content injected at build time (scripts/generate-og-pages.mjs).
// Once React takes over, it is redundant — remove it to keep the DOM clean.
document.getElementById("seo-static")?.remove();

createRoot(document.getElementById("root")!).render(<App />);
