import { useLayoutEffect, useState } from "react";

function qrImageUrl(data: string, px: number): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&margin=8&data=${encodeURIComponent(data)}`;
}

type Props = {
  target: string;
  sizePx: number;
  className?: string;
};

export function MapSheetQr({ target, sizePx, className }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useLayoutEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    const remote = qrImageUrl(target, sizePx);

    setSrc(null);
    void fetch(remote)
      .then((res) => {
        if (!res.ok) throw new Error("qr fetch failed");
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(remote);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [target, sizePx]);

  return (
    <img
      className={className}
      src={src ?? remotePlaceholder(sizePx)}
      width={sizePx}
      height={sizePx}
      alt=""
      decoding="sync"
      loading="eager"
    />
  );
}

/** Tiny inline PNG placeholder so layout is stable before fetch completes. */
function remotePlaceholder(px: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}"><rect width="100%" height="100%" fill="#f6f3ef"/><rect x="8" y="8" width="${px - 16}" height="${px - 16}" fill="none" stroke="#c8d9d4" stroke-width="2"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
