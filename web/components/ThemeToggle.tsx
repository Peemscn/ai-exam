"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // sync state กับ theme ที่ inline script (ใน layout) ตั้งไว้ก่อน paint
  useEffect(() => {
    // sync state กับ dataset ที่ no-flash script ตั้งก่อน paint (client-only) — เลี่ยง hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme((document.documentElement.dataset.theme as "dark" | "light") || "dark");
  }, []);

  function toggle() {
    const t = theme === "dark" ? "light" : "dark";
    setTheme(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("theme", t);
    } catch {
      /* ignore */
    }
  }

  return (
    <button className="navtoggle" onClick={toggle} aria-label="สลับธีม" title="สลับ dark / light">
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
