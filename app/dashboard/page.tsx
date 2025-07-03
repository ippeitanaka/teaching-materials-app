"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentList } from "@/components/document-list"
import { GeneratedMaterials } from "@/components/generated-materials"
import { FileUpload } from "@/components/file-upload"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardNav } from "@/components/dashboard-nav"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("documents")
  const [documentCount, setDocumentCount] = useState(0)
  const [materialCount, setMaterialCount] = useState(0)
  const [templateCount, setTemplateCount] = useState(0)
  const { isLoading, guestId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // ローカルストレージからカウント情報を取得
    const guestDocuments = JSON.parse(localStorage.getItem("guest_documents") || "[]")
    const guestMaterials = JSON.parse(localStorage.getItem("guest_materials") || "[]")
    const guestTemplates = JSON.parse(localStorage.getItem("guest_templates") || "[]")

    setDocumentCount(guestDocuments.length)
    setMaterialCount(guestMaterials.length)
    setTemplateCount(guestTemplates.length)
  }, [guestId])

  // ゲストモードの表示
  const renderGuestBanner = () => {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-amber-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <div className="flex-1">
            <p className="text-amber-800 font-medium">ゲストモードで利用中</p>
            <p className="text-amber-700 text-sm">
              データはブラウザに一時的に保存されます。ブラウザのキャッシュをクリアすると、データが失われる可能性があります。
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-6">
        {renderGuestBanner()}

        <div className="flex flex-col md:flex-row gap-6">
          <DashboardNav activeItem="dashboard" />

          <main className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
              <Link href="/dashboard?tab=upload">
                <Button className="bg-purple-600 hover:bg-purple-700 mt-2 sm:mt-0">新規アップロード</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">アップロード済み資料</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{documentCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">生成済み教材</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{materialCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">保存済みテンプレート</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{templateCount}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="documents" className="mb-6">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="documents">アップロード資料</TabsTrigger>
                <TabsTrigger value="materials">生成済み教材</TabsTrigger>
                <TabsTrigger value="upload">新規アップロード</TabsTrigger>
              </TabsList>
              <TabsContent value="documents">
                <DocumentList />
              </TabsContent>
              <TabsContent value="materials">
                <GeneratedMaterials />
              </TabsContent>
              <TabsContent value="upload">
                <Card>
                  <CardHeader>
                    <CardTitle>新規資料のアップロード</CardTitle>
                    <CardDescription>PDFまたは画像ファイルをアップロードして、教材を生成します</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload dashboard={true} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>最近の活動</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentCount > 0 ? (
                    [{ action: "資料をアップロード", document: "最近のアップロード", time: "最近" }].map(
                      (activity, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{activity.action}</p>
                            <p className="text-sm text-slate-500">{activity.document}</p>
                          </div>
                          <span className="text-sm text-slate-500">{activity.time}</span>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-slate-500">まだ活動記録がありません</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}
