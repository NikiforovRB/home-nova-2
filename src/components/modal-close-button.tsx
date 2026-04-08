"use client";

import { useState } from "react";

const I = (p: string) => `/icons/${p}`;

type Props = {
  onClose: () => void;
  label?: string;
  className?: string;
};

export function ModalCloseButton({ onClose, label = "Закрыть", className = "" }: Props) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center justify-center rounded-[8px] p-1.5 text-[#757575] outline-none transition-colors hover:bg-[#f2f1f0] ${className}`}
      onClick={onClose}
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={hover ? I("close-nav.svg") : I("close.svg")} alt="" width={22} height={22} />
    </button>
  );
}
