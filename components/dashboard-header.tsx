"use client"

import Link from "next/link"
import { LogoImage } from "./logo-image"

export function DashboardHeader() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <LogoImage width={32} height={32} />
            <h1 className="text-xl font-bold text-slate-800">TMC教材作成アシスタント</h1>
          </Link>
        </div>
      </div>
    </header>
  )
}
