"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/file-upload"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/contexts/auth-context"
import { DocumentList } from "@/components/document-list"
import { GeneratedMaterials } from "@/components/generated-materials"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const { isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"upload" | "documents" | "materials">("upload")

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab")
    if (tabParam === "documents" || tabParam === "materials") {
      setActiveTab(tabParam)
      return
    }
    setActiveTab("upload")
  }, [])

  const handleTabChange = (value: string) => {
    const nextTab = value === "documents" || value === "materials" ? value : "upload"
    setActiveTab(nextTab)
    router.replace(`/dashboard?tab=${nextTab}`)
  }

  // シンプルな情報バナー
  const renderInfoBanner = () => {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-blue-500"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <div className="flex-1">
            <p className="text-blue-800 font-medium">TMC教材作成アシスタント</p>
            <p className="text-blue-700 text-sm">
              PDF・画像ファイルをアップロードして、AIで教材を自動生成します
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
        {renderInfoBanner()}

        <main className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">教材作成アシスタント</h1>
            <p className="text-slate-600">資料のアップロード、資料一覧、生成済み教材の管理をここで行えます</p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full mb-6">
              <TabsTrigger value="upload">アップロード</TabsTrigger>
              <TabsTrigger value="documents">資料一覧</TabsTrigger>
              <TabsTrigger value="materials">教材一覧</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>新規資料のアップロード</CardTitle>
                  <CardDescription>
                    PDFファイルまたは画像ファイルをアップロードして、穴埋めプリント、まとめシート、小テストなどの教材を生成します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload dashboard={true} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">穴埋めプリント</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">重要な用語や概念を空欄にした学習プリントを自動生成</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">まとめシート</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">内容の要点を整理した分かりやすいまとめシートを作成</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">小テスト</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">選択式・記述式問題を組み合わせた小テストを生成</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <DocumentList />
            </TabsContent>

            <TabsContent value="materials">
              <GeneratedMaterials />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
