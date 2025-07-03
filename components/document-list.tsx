"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface Document {
  id: string
  title: string
  file_type: string
  file_path: string
  file_size: number
  created_at: string
  materials_count?: number
}

export function DocumentList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date-desc")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const { guestId } = useAuth()

  useEffect(() => {
    fetchDocuments()
  }, [guestId, sortBy])

  const fetchDocuments = async () => {
    try {
      setLoading(true)

      // ローカルストレージからデータを取得
      const guestDocuments = JSON.parse(localStorage.getItem("guest_documents") || "[]")

      // 並び替え
      const sortedDocuments = [...guestDocuments].sort((a, b) => {
        if (sortBy === "date-desc") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        } else if (sortBy === "date-asc") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        } else if (sortBy === "name-asc") {
          return a.title.localeCompare(b.title)
        } else if (sortBy === "name-desc") {
          return b.title.localeCompare(a.title)
        }
        return 0
      })

      // 各ドキュメントに関連する教材の数を取得
      const guestMaterials = JSON.parse(localStorage.getItem("guest_materials") || "[]")

      const documentsWithMaterialsCount = sortedDocuments.map((doc) => {
        const materialsCount = guestMaterials.filter((m) => m.document_id === doc.id).length
        return {
          ...doc,
          materials_count: materialsCount,
        }
      })

      setDocuments(documentsWithMaterialsCount)
    } catch (error: any) {
      console.error("ドキュメント取得エラー:", error)
      toast({
        title: "エラー",
        description: "ドキュメントの取得中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter((doc) => doc.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <Input
              placeholder="資料を検索..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="並び替え" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">新しい順</SelectItem>
                <SelectItem value="date-asc">古い順</SelectItem>
                <SelectItem value="name-asc">名前（昇順）</SelectItem>
                <SelectItem value="name-desc">名前（降順）</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-slate-500">読み込み中...</p>
            </div>
          ) : filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center border rounded-lg p-3 hover:bg-slate-50">
                <div className="h-15 w-12 mr-4 flex-shrink-0">
                  <img
                    src={"/placeholder.svg?height=60&width=48&query=document"}
                    alt={doc.title}
                    className="h-full w-full object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate">{doc.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <span className="text-xs text-slate-500">{doc.file_type}</span>
                    <span className="text-xs text-slate-500">{formatDate(doc.created_at)}</span>
                    <span className="text-xs text-slate-500">{formatFileSize(doc.file_size)}</span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      {doc.materials_count || 0}個の教材
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link href={`/editor/${doc.id}`}>
                    <Button variant="outline" size="sm">
                      教材作成
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">資料がまだアップロードされていません</p>
              <Link href="/dashboard?tab=upload" className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  資料をアップロード
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
