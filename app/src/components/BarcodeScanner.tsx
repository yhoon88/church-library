"use client";

import { useEffect, useRef, useState } from "react";

type Controls = { stop: () => void };

/**
 * 카메라로 바코드(ISBN)를 읽는다. 인식되면 onDetected(isbn) 한 번 호출.
 * 카메라를 못 쓰면 onUnavailable() 호출.
 */
export default function BarcodeScanner({
  onDetected,
  onUnavailable,
}: {
  onDetected: (isbn: string) => void;
  onUnavailable?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cbRef = useRef(onDetected);
  const unRef = useRef(onUnavailable);
  cbRef.current = onDetected;
  unRef.current = onUnavailable;
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let controls: Controls | null = null;
    let stopped = false;
    let done = false;
    const fail = () => {
      if (stopped) return;
      setUnavailable(true);
      unRef.current?.();
    };
    (async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        fail();
        return;
      }
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (stopped || !videoRef.current) return;
        const reader = new BrowserMultiFormatReader();
        const c = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } }, audio: false },
          videoRef.current,
          (result) => {
            if (!result || done) return;
            const text = result.getText().replace(/[^0-9Xx]/g, "");
            if (text.length < 10) return;
            done = true;
            try {
              controls?.stop();
            } catch {}
            cbRef.current(text);
          },
        );
        controls = c;
        if (stopped) c.stop();
      } catch {
        fail();
      }
    })();
    return () => {
      stopped = true;
      try {
        controls?.stop();
      } catch {}
    };
  }, []);

  if (unavailable) return null;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[30%] w-[78%] rounded-lg border-4 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
      </div>
    </div>
  );
}
