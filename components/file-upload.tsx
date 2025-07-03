"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"
import { extractTextFromPDF, extractTextFromImage, analyzeTextContent } from "@/lib/document-processor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// ファイルサイズの最大値（5MB）
const MAX_FILE_SIZE = 5 * 1024 * 1024

export function FileUpload({ dashboard = false }: { dashboard?: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [processingText, setProcessingText] = useState("")
  const [manualText, setManualText] = useState("")
  const [activeTab, setActiveTab] = useState<string>("file")
  const [textAnalysis, setTextAnalysis] = useState<{
    recommendedType: string
    subjectArea: string
    complexity: number
    keyTerms: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { guestId } = useAuth()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      handleFileSelection(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      handleFileSelection(selectedFile)
    }
  }

  const handleFileSelection = (selectedFile: File) => {
    // エラーをリセット
    setError(null)

    // ファイルサイズチェック
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。`)
      return
    }

    // サポートされているファイルタイプのチェック
    const fileType = selectedFile.type
    if (!fileType.includes("pdf") && !fileType.includes("image")) {
      setError(`サポートされていないファイルタイプです: ${fileType}。PDFまたは画像ファイルを選択してください。`)
      return
    }

    setFile(selectedFile)
    if (!title) {
      setTitle(selectedFile.name.split(".")[0])
    }
  }

  // テキスト入力が変更されたときに分析を実行
  useEffect(() => {
    const analyzeText = async () => {
      if (manualText.length > 100) {
        const analysis = await analyzeTextContent(manualText)
        setTextAnalysis(analysis)
      } else {
        setTextAnalysis(null)
      }
    }

    if (activeTab === "text" && manualText) {
      const debounceTimer = setTimeout(() => {
        analyzeText()
      }, 1000)

      return () => clearTimeout(debounceTimer)
    }
  }, [manualText, activeTab])

  const handleUpload = async () => {
    // エラーをリセット
    setError(null)

    if (activeTab === "file" && !file) {
      setError("ファイルが選択されていません")
      return
    }

    if (activeTab === "text" && !manualText.trim()) {
      setError("テキストを入力してください")
      return
    }

    if (!title.trim()) {
      setError("タイトルを入力してください")
      return
    }

    setUploading(true)
    setProcessingText("処理中...")

    try {
      // ドキュメントIDの生成
      const documentId = uuidv4()

      // ファイルパスの作成
      const filePath =
        activeTab === "file" && file
          ? `${guestId}/${documentId}/${file.name}`
          : `${guestId}/${documentId}/manual-text.txt`

      // ファイルタイプとサイズの設定
      const fileType = activeTab === "file" && file ? file.type : "text/plain"
      const fileSize = activeTab === "file" && file ? file.size : new Blob([manualText]).size

      // テキスト抽出またはマニュアルテキストの使用
      let extractedText = ""

      if (activeTab === "text") {
        // マニュアル入力されたテキストを使用
        extractedText = manualText
        setProcessingText("テキストを分析中...")

        // テキスト分析を実行
        if (!textAnalysis) {
          const analysis = await analyzeTextContent(manualText)
          setTextAnalysis(analysis)
        }
      } else if (activeTab === "file" && file) {
        // ファイルからテキストを抽出
        if (file.type.includes("pdf")) {
          setProcessingText("PDFからテキストを抽出中...")
          extractedText = await extractTextFromPDF(file)
        } else if (file.type.includes("image")) {
          setProcessingText("画像からテキストを抽出中...")
          extractedText = await extractTextFromImage(file)
        }

        // 抽出されたテキストが少なすぎる場合は警告
        if (extractedText.length < 50) {
          toast({
            title: "警告",
            description: "テキストの抽出量が少なすぎます。別のファイルを試すか、テキストを直接入力してください。",
            variant: "warning",
          })
        }
      }

      // テキスト抽出に失敗した場合のデフォルトテキスト
      if (!extractedText) {
        extractedText = "テキストの抽出に失敗しました。別のファイルをお試しください。"
        setError("テキストの抽出に失敗しました。別のファイルをお試しください。")
        setUploading(false)
        return
      }

      // ドキュメント情報を作成
      const documentInfo = {
        id: documentId,
        user_id: guestId,
        title: title.trim(),
        description: description.trim(),
        file_path: filePath,
        file_type: fileType,
        file_size: fileSize,
        processing_status: "completed",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        extracted_text: extractedText,
        text_analysis: textAnalysis || (await analyzeTextContent(extractedText)),
      }

      try {
        // ローカルストレージに保存
        const guestDocuments = JSON.parse(localStorage.getItem("guest_documents") || "[]")
        guestDocuments.push(documentInfo)
        localStorage.setItem("guest_documents", JSON.stringify(guestDocuments))

        toast({
          title: "アップロード成功",
          description: "テキストが正常に保存されました。教材生成を開始します。",
        })

        // 少し遅延を入れてからリダイレクト（ローカルストレージの保存を確実にするため）
        setTimeout(() => {
          router.push(`/editor/${documentId}`)
        }, 500)
      } catch (storageError) {
        console.error("ローカルストレージエラー:", storageError)
        setError(
          "ブラウザのストレージに保存できませんでした。ファイルサイズを小さくするか、ブラウザのキャッシュをクリアしてください。",
        )
        throw storageError
      }
    } catch (error: any) {
      console.error("アップロードエラー:", error)
      setError(error.message || "ファイルのアップロード中にエラーが発生しました。")
    } finally {
      setUploading(false)
      setProcessingText("")
    }
  }

  return (
    <Card className={dashboard ? "" : "max-w-2xl mx-auto"}>
      <CardHeader>
        <CardTitle>資料をアップロード</CardTitle>
        <CardDescription>
          PDFや画像ファイルをアップロードするか、テキストを直接入力して教材生成を開始します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="資料のタイトル"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">説明（任意）</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="資料の説明"
              className="mt-1"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="file">ファイルをアップロード</TabsTrigger>
              <TabsTrigger value="text">テキストを入力</TabsTrigger>
            </TabsList>

            <TabsContent value="file">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  dragging ? "border-purple-500 bg-purple-50" : "border-slate-300"
                } transition-colors duration-200`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center gap-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-12 w-12 ${dragging ? "text-purple-500" : "text-slate-400"}`}
                  >
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m16 16-4-4-4 4" />
                  </svg>
                  <div>
                    <p className="text-lg font-medium mb-1">ファイルをドラッグ＆ドロップ</p>
                    <p className="text-sm text-slate-500 mb-4">または下のボタンからファイルを選択してください</p>
                    <Label
                      htmlFor="file-upload"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-purple-600 text-white hover:bg-purple-700 h-10 px-4 py-2 cursor-pointer"
                    >
                      ファイルを選択
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>

              {file && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-slate-500"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="font-medium">{file.name}</span>
                      <span className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      削除
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="text">
              <div>
                <textarea
                  id="manual-text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="ここにテキストを入力してください..."
                  className="w-full min-h-[200px] p-3 border rounded-md"
                />

                {textAnalysis && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-medium text-slate-900 mb-2">テキスト分析結果</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">推奨教材タイプ:</span> {(() => {
                          switch (textAnalysis.recommendedType) {
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
                              return textAnalysis.recommendedType
                          }
                        })()}
                      </div>
                      <div>
                        <span className="font-medium">科目領域:</span> {textAnalysis.subjectArea}
                      </div>
                      <div>
                        <span className="font-medium">複雑さ:</span> {textAnalysis.complexity}/100
                      </div>
                      <div>
                        <span className="font-medium">キーワード:</span>{" "}
                        {textAnalysis.keyTerms.length > 0 ? textAnalysis.keyTerms.join(", ") : "なし"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-medium">注意:</span>{" "}
              データはブラウザのローカルストレージに保存されます。ブラウザのキャッシュをクリアすると、データが失われる可能性があります。
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {uploading ? (
          <div className="flex-1 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-sm text-slate-600">{processingText}</p>
          </div>
        ) : (
          <>
            <Button variant="outline" onClick={() => router.back()}>
              キャンセル
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              disabled={(activeTab === "file" && !file) || (activeTab === "text" && !manualText) || !title}
              onClick={handleUpload}
            >
              {activeTab === "text" ? "テキストを保存して教材を作成" : "アップロードして教材を作成"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
