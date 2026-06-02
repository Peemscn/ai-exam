"use client";

import { useEffect } from "react";

// Swagger UI (interactive) อ่าน spec จาก /api/openapi — โหลด UI จาก CDN (self-contained spec)
export default function ApiDocs() {
  useEffect(() => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
    document.head.appendChild(css);

    const js = document.createElement("script");
    js.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    js.crossOrigin = "anonymous";
    js.onload = () => {
      const w = window as unknown as { SwaggerUIBundle?: (o: object) => void };
      w.SwaggerUIBundle?.({
        url: "/api/openapi",
        dom_id: "#swagger-ui",
        deepLinking: true,
        tryItOutEnabled: true,
      });
    };
    document.body.appendChild(js);

    return () => {
      css.remove();
      js.remove();
    };
  }, []);

  return (
    <main>
      <header className="hero" style={{ padding: "34px 20px 26px" }}>
        <h1>🔌 <span className="grad">API Docs</span></h1>
        <p>OpenAPI 3.1 · Swagger UI (interactive — กด Try it out ได้) · spec ที่ <code>/api/openapi</code></p>
      </header>
      <div className="container" style={{ paddingTop: 16, paddingBottom: 40 }}>
        <div id="swagger-ui" style={{ background: "#fff", borderRadius: 14, overflow: "hidden" }} />
      </div>
    </main>
  );
}
