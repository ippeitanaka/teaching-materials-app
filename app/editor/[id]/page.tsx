"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DashboardHeader } from "@/components/dashboard-header"
import { DocumentPreview } from "@/components/document-preview"
import { MaterialEditor } from "@/components/material-editor"
import { toast } from "@/hooks/use-toast"
import { generateMaterialWithAI } from "@/lib/ai"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from "docx"
import { saveAs } from "file-saver"

interface Document {
  id: string
  title: string
  description?: string
  file_type: string
  extracted_text: string
  text_analysis?: {
    recommendedType: string
    subjectArea: string
    complexity: number
    keyTerms: string[]
  }
}

export default function EditorPage({ params }: { params: { id: string } }) {
  const [initialSetup, setInitialSetup] = useState(true)
  const [materialType, setMaterialType] = useState("fill-in-blank")
  const [difficulty, setDifficulty] = useState(50)
  const [options, setOptions] = useState({
    blankNumberType: "numeric",
    blankNumberPosition: "after",
    blankStyle: "underline",
    difficulty: "中級",
    questionCount: 10,
    sectionCount: 5,
    quizType: "mixed", // 追加: 小テストの問題形式
  })
  const [autoGenerate, setAutoGenerate] = useState(false) // デフォルトをfalseに変更
  const [document, setDocument] = useState<Document | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editableText, setEditableText] = useState("")
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [modelInfo, setModelInfo] = useState<string>("オフラインモード対応")
  const [activeTab, setActiveTab] = useState<string>("editor")
  const [apiProvider, setApiProvider] = useState<string>("gemini") // デフォルトでGemini APIを使用
  const { guestId } = useAuth()
  const router = useRouter()

  // ドキュメント情報の取得
  useEffect(() => {
    const fetchDocument = () => {
      try {
        // ローカルストレージからドキュメントを取得
        const guestDocuments = JSON.parse(localStorage.getItem("guest_documents") || "[]")
        const doc = guestDocuments.find((doc: any) => doc.id === params.id)

        if (doc) {
          setDocument(doc)
          setEditableText(doc.extracted_text)

          // テキスト分析結果に基づいて教材タイプを設定
          if (doc.text_analysis?.recommendedType) {
            setMaterialType(doc.text_analysis.recommendedType)
          }

          // テキスト分析結果に基づいて難易度を設定
          if (doc.text_analysis?.complexity !== undefined) {
            setDifficulty(doc.text_analysis.complexity)
          }

          // 自動生成はデフォルトで無効にする（初期設定を促す）
          // 自動生成は行わず、ユーザーが明示的に生成ボタンをクリックするのを待つ
        } else {
          toast({
            title: "エラー",
            description: "ドキュメントが見つかりませんでした",
            variant: "destructive",
          })
          setError("ドキュメントが見つかりませんでした。ダッシュボードに戻って再試行してください。")
        }
      } catch (error) {
        console.error("ドキュメント取得エラー:", error)
        toast({
          title: "エラー",
          description: "ドキュメントの取得中にエラーが発生しました",
          variant: "destructive",
        })
        setError("ドキュメントの取得中にエラーが発生しました。ページを再読み込みしてください。")
      }
    }

    fetchDocument()

    // 使用可能なモデルの情報を表示
    const checkModels = async () => {
      try {
        // 常にGeminiモデルを使用することを表示
        setModelInfo("Google Geminiで生成されました")
      } catch (error) {
        console.error("モデル情報の取得エラー:", error)
        setModelInfo("モデル情報の取得に失敗しました")
      }
    }

    checkModels()
  }, [params.id])

  // 教材生成ハンドラ
  const handleGenerateMaterial = async (text: string) => {
    if (!text) {
      toast({
        title: "エラー",
        description: "テキストが空です。テキストを入力するか、ファイルをアップロードしてください。",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const generationOptions = {
        title: document?.title || "教材",
        difficulty: difficultyToText(difficulty),
        questionCount: options.questionCount || 10,
        sectionCount: options.sectionCount || 5,
        assignmentCount: 3,
        cardCount: 15,
        subjectArea: document?.text_analysis?.subjectArea || "一般",
        keyTerms: document?.text_analysis?.keyTerms || [],
        blankNumberType: options.blankNumberType || "numeric",
        blankNumberPosition: options.blankNumberPosition || "after",
        blankStyle: options.blankStyle || "underline",
        quizType: options.quizType || "mixed", // 追加: 小テストの問題形式
        apiProvider: apiProvider,
      }

      // テキストが長すぎる場合は切り詰める（APIの制限を考慮）
      const maxLength = 8000 // 適切な長さに調整
      const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + "..." : text

      const content = await generateMaterialWithAI(truncatedText, materialType, generationOptions)
      setGeneratedContent(content)

      // 使用されたモデルの情報を更新
      setModelInfo(apiProvider === "deepseek" ? "DeepSeekで生成されました" : "Google Geminiで生成されました")
      setApiProvider(apiProvider) // 選択状態を保持

      // 教材を保存
      saveMaterial(content)

      toast({
        title: "生成完了",
        description: "教材が正常に生成されました",
      })
    } catch (error: any) {
      console.error("教材生成エラー:", error)
      setError("教材の生成中にエラーが発生しました。別の教材タイプを試すか、テキストを短くしてください。")

      // エラー時にもデフォルトのコンテンツを設定
      const fallbackContent = `# ${document?.title || "教材"} - ${getMaterialTypeLabel(materialType)}

申し訳ありませんが、AIによる教材生成中にエラーが発生しました。
以下のいずれかの方法をお試しください：

1. 別の教材タイプを選択する
2. テキストの長さを短くする
3. 後でもう一度試す

元のテキスト（一部）:
${text.substring(0, 200)}...`

      setGeneratedContent(fallbackContent)
    } finally {
      setIsGenerating(false)
    }
  }

  // 難易度を文字列に変換
  const difficultyToText = (value: number): string => {
    if (value < 30) return "初級"
    if (value < 70) return "中級"
    return "上級"
  }

  // 教材保存
  const saveMaterial = (content: string) => {
    try {
      if (!document) return

      // ユニークIDを生成
      const materialId = `${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}`

      // 教材オブジェクトを作成
      const material = {
        id: materialId,
        user_id: guestId,
        document_id: document.id,
        title: `${document.title} - ${getMaterialTypeLabel(materialType)}`,
        material_type: materialType,
        content: content,
        options: {
          difficulty: difficultyToText(difficulty),
          subjectArea: document.text_analysis?.subjectArea || "一般",
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // ローカルストレージに保存
      const guestMaterials = JSON.parse(localStorage.getItem("guest_materials") || "[]")
      guestMaterials.push(material)
      localStorage.setItem("guest_materials", JSON.stringify(guestMaterials))
    } catch (error) {
      console.error("教材保存エラー:", error)
    }
  }

  // 教材を手動で保存
  const handleSaveMaterial = () => {
    if (!generatedContent) {
      toast({
        title: "エラー",
        description: "保存する教材がありません。まず教材を生成してください。",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      saveMaterial(generatedContent)
      toast({
        title: "保存完了",
        description: "教材が正常に保存されました",
      })
      // 保存後にダッシュボードに戻る
      setTimeout(() => {
        router.push("/dashboard?tab=materials")
      }, 500)
    } catch (error) {
      console.error("教材保存エラー:", error)
      toast({
        title: "エラー",
        description: "教材の保存中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Word文書としてエクスポート
  const handleExportToWord = async () => {
    if (!generatedContent) {
      toast({
        title: "エラー",
        description: "エクスポートする教材がありません。まず教材を生成してください。",
        variant: "destructive",
      })
      return
    }

    try {
      // マークダウンテキストをWordドキュメントに変換
      const paragraphs: Paragraph[] = []
      
      // 教材タイトル
      const title = `${document?.title || "教材"} - ${getMaterialTypeLabel(materialType)}`
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 32 })],
          heading: HeadingLevel.TITLE,
        })
      )

      // 生成日時
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: `生成日時: ${new Date().toLocaleString('ja-JP')}`, size: 20 })],
        })
      )

      paragraphs.push(new Paragraph({ children: [new TextRun("")] })) // 空行

      // マークダウンテキストを解析してWordに変換
      const lines = generatedContent.split('\n')
      let currentContent = ''

      for (const line of lines) {
        if (line.startsWith('# ')) {
          // 見出し1
          if (currentContent) {
            paragraphs.push(new Paragraph({ children: [new TextRun(currentContent)] }))
            currentContent = ''
          }
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line.substring(2), bold: true, size: 28 })],
              heading: HeadingLevel.HEADING_1,
            })
          )
        } else if (line.startsWith('## ')) {
          // 見出し2
          if (currentContent) {
            paragraphs.push(new Paragraph({ children: [new TextRun(currentContent)] }))
            currentContent = ''
          }
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line.substring(3), bold: true, size: 24 })],
              heading: HeadingLevel.HEADING_2,
            })
          )
        } else if (line.startsWith('### ')) {
          // 見出し3
          if (currentContent) {
            paragraphs.push(new Paragraph({ children: [new TextRun(currentContent)] }))
            currentContent = ''
          }
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line.substring(4), bold: true, size: 22 })],
              heading: HeadingLevel.HEADING_3,
            })
          )
        } else if (line.trim() === '') {
          // 空行
          if (currentContent) {
            paragraphs.push(new Paragraph({ children: [new TextRun(currentContent)] }))
            currentContent = ''
          }
          paragraphs.push(new Paragraph({ children: [new TextRun("")] }))
        } else {
          // 通常のテキスト
          if (currentContent) {
            currentContent += '\n' + line
          } else {
            currentContent = line
          }
        }
      }

      // 最後の内容を追加
      if (currentContent) {
        paragraphs.push(new Paragraph({ children: [new TextRun(currentContent)] }))
      }

      // Word文書を作成
      const doc = new DocxDocument({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      })

      // ファイルを生成してダウンロード
      const buffer = await Packer.toBuffer(doc)
      const fileName = `${document?.title || "教材"}_${getMaterialTypeLabel(materialType)}_${new Date().toISOString().split('T')[0]}.docx`
      
      saveAs(new Blob([new Uint8Array(buffer)]), fileName)

      toast({
        title: "エクスポート完了",
        description: "Word文書が正常にダウンロードされました",
      })
    } catch (error) {
      console.error("Wordエクスポートエラー:", error)
      toast({
        title: "エラー",
        description: "Word文書のエクスポート中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  // 教材タイプのラベルを取得
  const getMaterialTypeLabel = (type: string): string => {
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
        return "教材"
    }
  }

  // 教材タイプまたは難易度が変更されたときの処理
  const handleSettingsChange = (newType: string, newDifficulty: number) => {
    // 設定を更新するだけで、自動的に再生成はしない
    if (newType !== materialType) {
      setMaterialType(newType)
    }

    if (newDifficulty !== difficulty) {
      setDifficulty(newDifficulty)
    }

    // 設定が変更されたことを通知
    if (newType !== materialType || newDifficulty !== difficulty) {
      toast({
        title: "設定を変更しました",
        description: "「教材を生成」ボタンをクリックして再生成できます",
      })
    }
  }

  // テキストを更新して再生成
  const handleUpdateText = () => {
    if (document) {
      // ドキュメントのテキストを更新
      const guestDocuments = JSON.parse(localStorage.getItem("guest_documents") || "[]")
      const updatedDocuments = guestDocuments.map((doc: any) => {
        if (doc.id === document.id) {
          return {
            ...doc,
            extracted_text: editableText,
            updated_at: new Date().toISOString(),
          }
        }
        return doc
      })
      localStorage.setItem("guest_documents", JSON.stringify(updatedDocuments))

      // 更新されたテキストで教材を再生成
      handleGenerateMaterial(editableText)

      // テキストエディタを閉じる
      setShowTextEditor(false)

      toast({
        title: "テキスト更新",
        description: "テキストが更新され、教材が再生成されました",
      })
    }
  }

  // 初期設定画面を表示
  if (initialSetup && document) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{document.title} - 教材設定</h1>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                キャンセル
              </Button>
            </div>
          </div>

          <Alert className="mb-6">
            <AlertTitle>注意</AlertTitle>
            <AlertDescription>
              現在、APIの制限により教材生成が失敗する場合があります。テキストを短く、簡潔にすることで生成の成功率が高まります。
              生成に失敗した場合は、エディタ機能を使用して手動で教材を作成することもできます。
            </AlertDescription>
          </Alert>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-bold mb-4">教材設定</h2>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="material-type">教材タイプ</Label>
                      <Select value={materialType} onValueChange={(value) => setMaterialType(value)}>
                        <SelectTrigger id="material-type">
                          <SelectValue placeholder="教材タイプを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fill-in-blank">穴埋めプリント</SelectItem>
                          <SelectItem value="summary">まとめシート</SelectItem>
                          <SelectItem value="quiz">小テスト</SelectItem>
                          <SelectItem value="assignment">課題</SelectItem>
                          <SelectItem value="flashcards">フラッシュカード</SelectItem>
                        </SelectContent>
                      </Select>

                      {document.text_analysis?.recommendedType && (
                        <p className="text-xs text-slate-500">
                          推奨タイプ: {getMaterialTypeLabel(document.text_analysis.recommendedType)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="difficulty">難易度</Label>
                        <span className="text-sm text-slate-500">{difficultyToText(difficulty)}</span>
                      </div>
                      <Slider
                        id="difficulty"
                        min={0}
                        max={100}
                        step={10}
                        value={[difficulty]}
                        onValueChange={(value) => setDifficulty(value[0])}
                      />

                      {document.text_analysis?.complexity !== undefined && (
                        <p className="text-xs text-slate-500">
                          推奨難易度: {difficultyToText(document.text_analysis.complexity)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="api-provider">使用モデル</Label>
                      <Select value={apiProvider} onValueChange={setApiProvider}>
                        <SelectTrigger id="api-provider">
                          <SelectValue placeholder="AIモデルを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini">Google Gemini</SelectItem>
                          <SelectItem value="deepseek">DeepSeek</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        DeepSeekはDeepSeek V3
                        Baseを使用する強力なAIモデルです（利用できない場合は他のモデルにフォールバック）
                      </p>
                    </div>

                    {materialType === "fill-in-blank" && (
                      <div className="space-y-4 border-t border-slate-200 pt-4 mt-4">
                        <h3 className="font-medium text-slate-900">穴埋め設定</h3>

                        <div className="space-y-2">
                          <Label htmlFor="blank-number-type">番号タイプ</Label>
                          <Select
                            value={options.blankNumberType || "numeric"}
                            onValueChange={(value) => setOptions({ ...options, blankNumberType: value })}
                          >
                            <SelectTrigger id="blank-number-type">
                              <SelectValue placeholder="番号タイプを選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="numeric">数字 (1, 2, 3...)</SelectItem>
                              <SelectItem value="alphabetic">アルファベット (a, b, c...)</SelectItem>
                              <SelectItem value="roman">ローマ数字 (i, ii, iii...)</SelectItem>
                              <SelectItem value="none">番号なし</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="blank-number-position">番号位置</Label>
                          <Select
                            value={options.blankNumberPosition || "after"}
                            onValueChange={(value) => setOptions({ ...options, blankNumberPosition: value })}
                          >
                            <SelectTrigger id="blank-number-position">
                              <SelectValue placeholder="番号位置を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="after">空欄の後 (_____（1）)</SelectItem>
                              <SelectItem value="before">空欄の前 (（1）_____)</SelectItem>
                              <SelectItem value="above">空欄の上</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="blank-style">空欄スタイル</Label>
                          <Select
                            value={options.blankStyle || "underline"}
                            onValueChange={(value) => setOptions({ ...options, blankStyle: value })}
                          >
                            <SelectTrigger id="blank-style">
                              <SelectValue placeholder="空欄スタイルを選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="underline">下線 (_____)</SelectItem>
                              <SelectItem value="box">四角 (□□□□□)</SelectItem>
                              <SelectItem value="parentheses">かっこ (　　　　)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {materialType === "quiz" && (
                      <div className="space-y-4 border-t border-slate-200 pt-4 mt-4">
                        <h3 className="font-medium text-slate-900">小テスト設定</h3>

                        <div className="space-y-2">
                          <Label htmlFor="quiz-type">問題形式</Label>
                          <Select
                            value={options.quizType || "mixed"}
                            onValueChange={(value) => setOptions({ ...options, quizType: value })}
                          >
                            <SelectTrigger id="quiz-type">
                              <SelectValue placeholder="問題形式を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="descriptive">記述式問題</SelectItem>
                              <SelectItem value="multiple-choice">5肢択一</SelectItem>
                              <SelectItem value="mixed">記述選択肢混合</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500">選択した形式に基づいて問題が生成されます</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="question-count">問題数</Label>
                          <Input
                            id="question-count"
                            type="number"
                            min="1"
                            max="100"
                            value={options.questionCount || 10}
                            onChange={(e) => setOptions({ ...options, questionCount: Number.parseInt(e.target.value) || 10 })}
                            placeholder="問題数を入力"
                          />
                          <p className="text-xs text-slate-500">1〜100問まで設定可能です</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-generate">自動生成を有効にする</Label>
                      <Switch id="auto-generate" checked={autoGenerate} onCheckedChange={setAutoGenerate} />
                    </div>

                    {document.text_analysis?.keyTerms && document.text_analysis.keyTerms.length > 0 && (
                      <div className="space-y-2">
                        <Label>キーワード</Label>
                        <div className="flex flex-wrap gap-2">
                          {document.text_analysis.keyTerms.map((term, index) => (
                            <span key={index} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs">
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold mb-4">元のテキスト（一部）</h2>
                  <div className="bg-slate-50 border rounded-md p-4 h-80 overflow-auto">
                    <p className="text-sm font-mono whitespace-pre-wrap">
                      {document.extracted_text.substring(0, 1000)}
                      {document.extracted_text.length > 1000 && "..."}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" onClick={() => setShowTextEditor(true)}>
                      テキストを編集
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t pt-6">
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    キャンセル
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      setInitialSetup(false)
                      handleGenerateMaterial(document.extracted_text)
                    }}
                  >
                    教材を生成
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 教材設定と教材エディタ/プレビューを並べて表示するレイアウト
  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{document ? document.title : "教材エディタ"}</h1>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button variant="outline" onClick={() => router.push("/dashboard?tab=materials")}>
              戻る
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportToWord}
              disabled={isGenerating || !generatedContent}
            >
              Wordエクスポート
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {document && !error && (
          <Alert className="mb-6">
            <AlertTitle>注意</AlertTitle>
            <AlertDescription>
              現在、APIの制限により教材生成が失敗する場合があります。テキストを短く、簡潔にすることで生成の成功率が高まります。
              生成に失敗した場合は、エディタ機能を使用して手動で教材を作成することもできます。
            </AlertDescription>
          </Alert>
        )}

        {showTextEditor ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">元のテキストを編集</h2>
              <Textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTextEditor(false)
                    // 初期設定画面から来た場合は初期設定画面に戻る
                    if (initialSetup) {
                      setInitialSetup(true)
                    }
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    handleUpdateText()
                    // 初期設定画面から来た場合は初期設定画面に戻る
                    if (initialSetup) {
                      setInitialSetup(true)
                    }
                  }}
                >
                  テキストを更新
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 左側：教材設定パネル - 常に表示 */}
            <div className="w-full lg:w-1/3 order-2 lg:order-1">
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">教材設定</h2>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="material-type">教材タイプ</Label>
                      <Select value={materialType} onValueChange={(value) => handleSettingsChange(value, difficulty)}>
                        <SelectTrigger id="material-type">
                          <SelectValue placeholder="教材タイプを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fill-in-blank">穴埋めプリント</SelectItem>
                          <SelectItem value="summary">まとめシート</SelectItem>
                          <SelectItem value="quiz">小テスト</SelectItem>
                          <SelectItem value="assignment">課題</SelectItem>
                          <SelectItem value="flashcards">フラッシュカード</SelectItem>
                        </SelectContent>
                      </Select>

                      {document?.text_analysis?.recommendedType && (
                        <p className="text-xs text-slate-500">
                          推奨タイプ: {getMaterialTypeLabel(document.text_analysis.recommendedType)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="difficulty">難易度</Label>
                        <span className="text-sm text-slate-500">{difficultyToText(difficulty)}</span>
                      </div>
                      <Slider
                        id="difficulty"
                        min={0}
                        max={100}
                        step={10}
                        value={[difficulty]}
                        onValueChange={(value) => handleSettingsChange(materialType, value[0])}
                      />

                      {document?.text_analysis?.complexity !== undefined && (
                        <p className="text-xs text-slate-500">
                          推奨難易度: {difficultyToText(document.text_analysis.complexity)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="api-provider">使用モデル</Label>
                      <Select value={apiProvider} onValueChange={(value) => setApiProvider(value)}>
                        <SelectTrigger id="api-provider">
                          <SelectValue placeholder="AIモデルを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini">Google Gemini</SelectItem>
                          <SelectItem value="deepseek">DeepSeek</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        DeepSeekはDeepSeek V3
                        Baseを使用する強力なAIモデルです（利用できない場合は他のモデルにフォールバック）
                      </p>
                    </div>

                    {materialType === "fill-in-blank" && (
                      <div className="space-y-4 border-t border-slate-200 pt-4 mt-4">
                        <h3 className="font-medium text-slate-900">穴埋め設定</h3>

                        <div className="space-y-2">
                          <Label htmlFor="blank-number-type">番号タイプ</Label>
                          <Select
                            value={options.blankNumberType || "numeric"}
                            onValueChange={(value) => setOptions({ ...options, blankNumberType: value })}
                          >
                            <SelectTrigger id="blank-number-type">
                              <SelectValue placeholder="番号タイプを選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="numeric">数字 (1, 2, 3...)</SelectItem>
                              <SelectItem value="alphabetic">アルファベット (a, b, c...)</SelectItem>
                              <SelectItem value="roman">ローマ数字 (i, ii, iii...)</SelectItem>
                              <SelectItem value="none">番号なし</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="blank-number-position">番号位置</Label>
                          <Select
                            value={options.blankNumberPosition || "after"}
                            onValueChange={(value) => setOptions({ ...options, blankNumberPosition: value })}
                          >
                            <SelectTrigger id="blank-number-position">
                              <SelectValue placeholder="番号位置を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="after">空欄の後 (_____（1）)</SelectItem>
                              <SelectItem value="before">空欄の前 (（1）_____)</SelectItem>
                              <SelectItem value="above">空欄の上</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="blank-style">空欄スタイル</Label>
                          <Select
                            value={options.blankStyle || "underline"}
                            onValueChange={(value) => setOptions({ ...options, blankStyle: value })}
                          >
                            <SelectTrigger id="blank-style">
                              <SelectValue placeholder="空欄スタイルを選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="underline">下線 (_____)</SelectItem>
                              <SelectItem value="box">四角 (□□□□□)</SelectItem>
                              <SelectItem value="parentheses">かっこ (　　　　)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {materialType === "quiz" && (
                      <div className="space-y-4 border-t border-slate-200 pt-4 mt-4">
                        <h3 className="font-medium text-slate-900">小テスト設定</h3>

                        <div className="space-y-2">
                          <Label htmlFor="quiz-type">問題形式</Label>
                          <Select
                            value={options.quizType || "mixed"}
                            onValueChange={(value) => setOptions({ ...options, quizType: value })}
                          >
                            <SelectTrigger id="quiz-type">
                              <SelectValue placeholder="問題形式を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="descriptive">記述式問題</SelectItem>
                              <SelectItem value="multiple-choice">5肢択一</SelectItem>
                              <SelectItem value="mixed">記述選択肢混合</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500">選択した形式に基づいて問題が生成されます</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="question-count">問題数</Label>
                          <Input
                            id="question-count"
                            type="number"
                            min="1"
                            max="100"
                            value={options.questionCount || 10}
                            onChange={(e) => setOptions({ ...options, questionCount: Number.parseInt(e.target.value) || 10 })}
                            placeholder="問題数を入力"
                          />
                          <p className="text-xs text-slate-500">1〜100問まで設定可能です</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-generate">自動生成</Label>
                      <Switch id="auto-generate" checked={autoGenerate} onCheckedChange={setAutoGenerate} />
                    </div>

                    <div className="space-y-2">
                      <Label>使用モデル</Label>
                      <Select value={apiProvider} onValueChange={(value) => setApiProvider(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="モデルを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini">Google Gemini</SelectItem>
                          <SelectItem value="deepseek">DeepSeek</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="text-sm bg-slate-100 p-2 rounded-md">{modelInfo}</div>
                    </div>

                    {document?.text_analysis?.keyTerms && document.text_analysis.keyTerms.length > 0 && (
                      <div className="space-y-2">
                        <Label>キーワード</Label>
                        <div className="flex flex-wrap gap-2">
                          {document.text_analysis.keyTerms.map((term, index) => (
                            <span key={index} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs">
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={isGenerating}
                      onClick={() => handleGenerateMaterial(editableText)}
                    >
                      {isGenerating ? "生成中..." : "教材を生成"}
                    </Button>
                    <p className="text-xs text-slate-500 text-center mt-2">
                      設定を変更した後、こちらのボタンから再生成できます
                    </p>

                    <Button className="w-full" variant="outline" onClick={() => setShowTextEditor(!showTextEditor)}>
                      {showTextEditor ? "エディタに戻る" : "元のテキストを編集"}
                    </Button>

                    {document && (
                      <div className="pt-4 border-t border-slate-200">
                        <h3 className="font-medium text-slate-900 mb-2">元の資料</h3>
                        <div className="bg-slate-100 rounded-lg p-4 flex items-center gap-2">
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
                          <span className="text-sm text-slate-700 truncate">
                            {document.title} ({document.file_type})
                          </span>
                        </div>

                        {document.text_analysis?.subjectArea && (
                          <div className="mt-2 text-xs text-slate-500">
                            科目領域: {document.text_analysis.subjectArea}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右側：エディタ/プレビュー */}
            <div className="w-full lg:w-2/3 order-1 lg:order-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="editor">エディタ</TabsTrigger>
                  <TabsTrigger value="preview">プレビュー</TabsTrigger>
                </TabsList>
                <TabsContent value="editor">
                  <MaterialEditor
                    documentId={params.id}
                    materialType={materialType}
                    content={generatedContent}
                    onContentChange={setGeneratedContent}
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <Card>
                    <CardContent className="p-6">
                      <DocumentPreview documentId={params.id} materialType={materialType} content={generatedContent} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
