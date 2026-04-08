"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

type Props = {
  images: string[];
  alt: string;
  /** Первое изображение above-the-fold (LCP) */
  priority?: boolean;
};

export function ListingHoverSlider({ images, alt, priority = false }: Props) {
  const list = useMemo(() => images.filter(Boolean).slice(0, 8), [images]);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (list.length <= 1) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
      const ratio = rect.width ? x / rect.width : 0;
      const idx = Math.min(list.length - 1, Math.floor(ratio * list.length));
      setActive(idx);
    },
    [list.length],
  );

  const onLeave = useCallback(() => {
    setActive(0);
    setHovered(false);
  }, []);

  if (list.length === 0) {
    return (
      <div className="relative flex aspect-[3/2] items-center justify-center rounded-[8px] bg-[#f2f1f0] text-sm text-[#757575]">
        Нет фото
      </div>
    );
  }

  return (
    <div
      className="relative flex aspect-[3/2] min-h-0 overflow-hidden rounded-[8px] bg-[#f2f1f0]"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={() => setHovered(true)}
    >
      <Image
        src={list[active]}
        alt={alt}
        width={1200}
        height={800}
        priority={priority}
        className="h-full w-full min-h-0 min-w-0 object-cover"
        sizes="(max-width: 768px) 50vw, 16vw"
      />
      {list.length > 1 && hovered && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5">
          {list.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === active ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
