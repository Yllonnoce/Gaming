"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * A QR code as inline SVG, so it scales to whatever box it is placed in and
 * stays crisp when shown full-screen for scanning across a table.
 *
 * Rendered after mount rather than on the server: the value is usually a URL
 * that includes the browser's own origin, which the server does not know.
 */
export function QrCode({ value, className = "" }: { value: string; className?: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, { type: "svg", errorCorrectionLevel: "M", margin: 1 })
      .then((markup) => {
        if (!cancelled) setSvg(markup);
      })
      .catch((error: unknown) => console.error("[qr] could not render:", error));
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!svg) {
    return <div className={`aspect-square animate-pulse rounded-lg bg-ink/10 ${className}`} />;
  }

  return (
    <div
      role="img"
      aria-label={`QR code for ${value}`}
      // The library's SVG is square with its own viewBox; sizing the wrapper
      // is enough, as long as the SVG is told to fill it.
      className={`aspect-square rounded-lg bg-white p-2 [&_svg]:h-full [&_svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
