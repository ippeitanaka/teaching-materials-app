"use client"

import Image from "next/image"

export function LogoImage({
  className = "h-8 w-auto",
  width = 32,
  height = 32,
}: {
  className?: string
  width?: number
  height?: number
}) {
  return (
    <div className="relative" style={{ width: width, height: height }}>
      <Image src="/tmc-logo-new.png" alt="TMC Logo" fill style={{ objectFit: "contain" }} priority />
    </div>
  )
}
