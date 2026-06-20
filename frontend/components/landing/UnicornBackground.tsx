"use client";

import { useEffect } from "react";

const SCENE_SRC = "/hero-scene.json";
const SRC =
  "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.0-1/dist/unicornStudio.umd.js";

declare global {
  interface Window {
    UnicornStudio?: { isInitialized?: boolean; init?: () => void };
  }
}

export function UnicornBackground({ className }: { className?: string }) {
  useEffect(() => {
    function init() {
      if (window.UnicornStudio?.init) {
        window.UnicornStudio.init();
        window.UnicornStudio.isInitialized = true;
      }
    }

    if (window.UnicornStudio?.isInitialized) return;

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`
    );

    if (window.UnicornStudio && existing) {
      init();
      return;
    }

    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false };
    }

    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.onload = init;
    document.body.appendChild(script);
  }, []);

  return (
    <div className={className} aria-hidden>
      <div data-us-project-src={SCENE_SRC} className="absolute inset-0 size-full" />
    </div>
  );
}
