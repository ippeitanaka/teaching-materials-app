"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/file-upload"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/contexts/auth-context"

export default function Dashboard() {
  const { isLoading } = useAuth()

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
            <p className="text-slate-600">PDFや画像ファイルをアップロードして、AIで教材を自動生成しましょう</p>
          </div>

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

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">穴埋めプリント</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  重要な用語や概念を空欄にした学習プリントを自動生成
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">まとめシート</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  内容の要点を整理した分かりやすいまとめシートを作成
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">小テスト</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  選択式・記述式問題を組み合わせた小テストを生成
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
