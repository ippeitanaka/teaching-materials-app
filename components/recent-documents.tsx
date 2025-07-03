import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function RecentDocuments() {
  const recentDocuments = [
    {
      id: "1",
      title: "物理学基礎講義",
      type: "PDF",
      date: "2025/04/25",
      materials: 3,
      thumbnail: "/open-physics-book.png",
    },
    {
      id: "2",
      title: "化学実験レポート",
      type: "PDF",
      date: "2025/04/23",
      materials: 2,
      thumbnail: "/chemistry-lab-setup.png",
    },
    {
      id: "3",
      title: "日本史概論",
      type: "PDF",
      date: "2025/04/20",
      materials: 4,
      thumbnail: "/open-japanese-history-book.png",
    },
    {
      id: "4",
      title: "数学演習問題集",
      type: "PDF",
      date: "2025/04/18",
      materials: 1,
      thumbnail: "/colorful-math-concepts.png",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>最近の資料</CardTitle>
          <CardDescription>最近アップロードした資料から教材を作成</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          すべて表示
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentDocuments.map((doc) => (
            <Link href={`/editor/${doc.id}`} key={doc.id}>
              <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center">
                  <img
                    src={doc.thumbnail || "/placeholder.svg"}
                    alt={doc.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-slate-900 truncate">{doc.title}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500">{doc.date}</span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      {doc.materials}個の教材
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
