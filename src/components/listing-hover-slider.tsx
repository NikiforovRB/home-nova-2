"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

type Props = {
  images: string[];
  alt: string;
};

export function ListingHoverSlider({ images, alt }: Props) {
  const list = useMemo(() => images.filter(Boolean), [images]);
  const [active, setActive] = useState(0);

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

  const onLeave = useCallback(() => setActive(0), []);

  if (list.length === 0) {
    return (
      <div className="relative flex aspect-[3/4] items-center justify-center rounded-[8px] bg-[#f2f1f0] text-sm text-[#757575]">
        Нет фото
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[3/4] overflow-hidden rounded-[8px] bg-[#f2f1f0]"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <Image
        src={list[active]}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 16vw"
      />
    </div>
  );
}
