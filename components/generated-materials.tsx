"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function GeneratedMaterials() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = () => {
    try {
      const guestMaterials = JSON.parse(localStorage.getItem("guest_materials") || "[]")
      setMaterials(guestMaterials)
    } catch (error) {
      console.error("教材の読み込みエラー:", error)
      toast({
        title: "エラー",
        description: "教材の読み込み中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMaterial = (id: string) => {
    setMaterialToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!materialToDelete) return

    try {
      const guestMaterials = JSON.parse(localStorage.getItem("guest_materials") || "[]")
      const updatedMaterials = guestMaterials.filter((material: any) => material.id !== materialToDelete)
      localStorage.setItem("guest_materials", JSON.stringify(updatedMaterials))

      // 状態を更新
      setMaterials(updatedMaterials)

      toast({
        title: "削除完了",
        description: "教材が正常に削除されました",
      })
    } catch (error) {
      console.error("教材削除エラー:", error)
      toast({
        title: "エラー",
        description: "教材の削除中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setMaterialToDelete(null)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "fill-in-blank":
        return "穴埋めプリント"
      case "summary":
        return "まとめシート"
      case "quiz":
        return "小テスト"
      case "assignment":
        return "課題"
      case "flashcards":
        return "フラッシュカード"
      default:
        return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "fill-in-blank":
        return "bg-blue-100 text-blue-800"
      case "summary":
        return "bg-green-100 text-green-800"
      case "quiz":
        return "bg-yellow-100 text-yellow-800"
      case "assignment":
        return "bg-red-100 text-red-800"
      case "flashcards":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const filteredMaterials = materials.filter(
    (material) =>
      (filterType === "all" || material.material_type === filterType) &&
      material.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
              placeholder="教材を検索..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="タイプで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="fill-in-blank">穴埋めプリント</SelectItem>
                <SelectItem value="summary">まとめシート</SelectItem>
                <SelectItem value="quiz">小テスト</SelectItem>
                <SelectItem value="assignment">課題</SelectItem>
                <SelectItem value="flashcards">フラッシュカード</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-slate-500">読み込み中...</p>
            </div>
          ) : filteredMaterials.length > 0 ? (
            filteredMaterials.map((material) => (
              <div key={material.id} className="flex items-center border rounded-lg p-3 hover:bg-slate-50">
                <div className="h-15 w-12 mr-4 flex-shrink-0">
                  <img
                    src={material.thumbnail || "/placeholder.svg?height=60&width=48&query=material"}
                    alt={material.title}
                    className="h-full w-full object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate">{material.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <Badge className={getTypeColor(material.material_type)}>
                      {getTypeLabel(material.material_type)}
                    </Badge>
                    <span className="text-xs text-slate-500">{formatDate(material.created_at)}</span>
                    <span className="text-xs text-slate-500">難易度: {material.options?.difficulty || "中級"}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link href={`/editor/${material.document_id}`}>
                    <Button variant="outline" size="sm">
                      編集
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteMaterial(material.id)}
                  >
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
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                  </Button>
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
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">検索結果がありません</p>
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>教材を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>この操作は元に戻せません。この教材は完全に削除されます。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
