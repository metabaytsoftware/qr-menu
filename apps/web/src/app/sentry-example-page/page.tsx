"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryExamplePage() {
  const [hasThrownError, setHasThrownError] = useState(false);

  const throwError = () => {
    setHasThrownError(true);
    throw new Error("Sentry test error — triggered from /sentry-example-page");
  };

  const captureMessage = () => {
    Sentry.captureMessage("Sentry test message from /sentry-example-page", "info");
    alert("Message sent to Sentry — check your Issues dashboard.");
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Sentry Test Page</h1>
      <p>
        Bu sayfa sadece geliştirme ve doğrulama içindir.{" "}
        <strong>Production'a almadan önce silin.</strong>
      </p>

      <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
        <button
          onClick={throwError}
          disabled={hasThrownError}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: hasThrownError ? "not-allowed" : "pointer",
          }}
        >
          Hata Fırlat (global-error.tsx test)
        </button>

        <button
          onClick={captureMessage}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#2980b9",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Mesaj Gönder (Sentry.captureMessage)
        </button>
      </div>

      <p style={{ marginTop: "1.5rem", color: "#666", fontSize: "0.875rem" }}>
        Hata gönderdikten sonra{" "}
        <a
          href="https://metabayt.sentry.io/issues/"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#2980b9" }}
        >
          sentry.io/issues
        </a>{" "}
        sayfasını kontrol edin.
      </p>
    </main>
  );
}
