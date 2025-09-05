import { FileUpload } from "@/components/file-upload"
import { Features } from "@/components/features"
import Link from "next/link"
import { LogoImage } from "@/components/logo-image"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LogoImage width={32} height={32} />
            <h1 className="text-xl font-bold text-slate-800">TMC教材作成アシスタント</h1>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-slate-600 hover:text-slate-900 font-medium">
              ホーム
            </Link>
            <Link href="/help" className="text-slate-600 hover:text-slate-900 font-medium">
              ヘルプ
            </Link>
          </nav>
        </div>
      </header>

      {/* 残りのコンテンツは変更なし */}
      <main className="container mx-auto px-4 py-12">
        <section className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            教材作成を<span className="text-purple-600">AI</span>でもっと簡単に
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            PDFや画像から穴埋めプリント、まとめシート、課題を自動生成。
            <br />
            教職員の資料作成をサポートします。
          </p>
        </section>

        <section className="mb-16">
          <FileUpload />
        </section>

        <section className="mb-16">
          <Features />
        </section>

        <section className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden mb-16">
          <div className="md:flex">
            <div className="md:shrink-0 bg-purple-600 md:w-48 flex items-center justify-center p-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-24 w-24 text-white"
              >
                <path d="M12 2v8"></path>
                <path d="m4.93 10.93 1.41 1.41"></path>
                <path d="M2 18h2"></path>
                <path d="M20 18h2"></path>
                <path d="m19.07 10.93-1.41 1.41"></path>
                <path d="M22 22H2"></path>
                <path d="m16 6-4 4-4-4"></path>
                <path d="M16 18a4 4 0 0 0-8 0"></path>
              </svg>
            </div>
            <div className="p-8">
              <div className="uppercase tracking-wide text-sm text-purple-600 font-semibold">時間を節約</div>
              <h3 className="mt-1 text-2xl font-medium text-slate-800">教材作成の時間を最大70%削減</h3>
              <p className="mt-2 text-slate-600">
                AIが資料の内容を理解し、教育目的に合わせた教材を自動生成します。
                穴埋め問題の作成、要点のまとめ、課題の設計など、時間のかかる作業を効率化します。
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">教材作成アシスタント</h3>
              <p className="text-slate-300">
                教職員の資料作成をサポートする
                <br />
                AIパワードアプリケーション
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">リンク</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-slate-300 hover:text-white">
                    ホーム
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-slate-300 hover:text-white">
                    ヘルプ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">サポート</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/help" className="text-slate-300 hover:text-white">
                    ヘルプセンター
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>Copyright © {new Date().getFullYear()} TMC DX Committee</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
