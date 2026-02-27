import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>ヘルプセンター</CardTitle>
            <CardDescription>ローカル完結モードでの使い方</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-slate-700">
            <section className="space-y-2">
              <h2 className="font-semibold text-slate-900">1. 資料をアップロード</h2>
              <p>ダッシュボードの「アップロード」から、PDF・画像または手入力テキストを登録できます。</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold text-slate-900">2. 教材を生成</h2>
              <p>教材タイプ・難易度・問題形式を選び、「教材を生成」を押して内容を作成します。</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold text-slate-900">3. 保存・再編集</h2>
              <p>保存した教材は「教材一覧」タブから再確認できます。必要に応じて Word エクスポートも可能です。</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold text-slate-900">注意</h2>
              <p>このモードではデータはブラウザのローカルストレージに保存されます。ブラウザのデータを削除すると消えるためご注意ください。</p>
            </section>

            <div className="flex gap-2 pt-2">
              <Link href="/dashboard?tab=upload">
                <Button className="bg-purple-600 hover:bg-purple-700">ダッシュボードへ</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">ホームへ</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
