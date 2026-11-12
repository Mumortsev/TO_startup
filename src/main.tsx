import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
// Prerendered studio pages need their styles before JavaScript loads.
import "./ArtStudio.css";
import "./MusicStudio.css";
import "./ArtworkCarousel.css";
import "./PhotoGallery.css";
import "./PhotoCarousel.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
