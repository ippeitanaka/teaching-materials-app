"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MaterialEditorProps {
  documentId: string
  materialType: string
  content: string
  onContentChange: (content: string) => void
}

export function MaterialEditor({ documentId, materialType, content, onContentChange }: MaterialEditorProps) {
  const [editorContent, setEditorContent] = useState<string>(content)

  useEffect(() => {
    setEditorContent(content)
  }, [content])

  useEffect(() => {
    onContentChange(editorContent)
  }, [editorContent, onContentChange])

  // 実際の実装では、documentIdとmaterialTypeに基づいて初期コンテンツを設定する

  const getInitialContent = () => {
    switch (materialType) {
      case "fill-in-blank":
        return `# 物理学基礎 - 穴埋めプリント

以下の文章の空欄に適切な言葉を入れなさい。

1. 物体に力が加わると、物体は力の方向に（　加速　）する。これは（　ニュートンの第二法則　）として知られている。

2. 物体の運動エネルギーは（　質量　）に比例し、（　速度　）の2乗に比例する。

3. 2つの物体間に働く（　万有引力　）は、2つの質量の積に比例し、距離の2乗に（　反比例　）する。

4. 閉じた系において、（　エネルギー　）の総和は一定である。これは（　エネルギー　）保存の法則と呼ばれる。

5. 光の（　速度　）は、媒質によって変化する。これが（　屈折　）の原因となる。`

      case "summary":
        return `# 物理学基礎 - まとめシート

## 1. 力学の基本法則

- ニュートンの運動の第一法則（慣性の法則）
- ニュートンの運動の第二法則（F = ma）
- ニュートンの運動の第三法則（作用・反作用の法則）

## 2. エネルギーと仕事

- 運動エネルギー: E = (1/2)mv²
- 位置エネルギー: E = mgh
- 仕事: W = F・d・cosθ

## 3. 万有引力

- 万有引力の法則: F = G(m₁m₂/r²)
- 重力加速度: g = GM/r²`

      case "quiz":
        return `# 物理学基礎 - 小テスト

以下の問題に答えなさい。

## 問1. 次のうち、ニュートンの第一法則を最もよく表しているのはどれか。

a. 物体に力が加わると、加速度が生じる
b. 外力が働かなければ、物体は静止または等速直線運動を続ける
c. 作用には反作用が存在する

## 問2. 質量2kgの物体に4Nの力を加えたとき、物体の加速度は何m/s²か。

a. 0.5 m/s²
b. 2 m/s²
c. 8 m/s²`

      default:
        return ""
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Tabs defaultValue="edit" className="w-full">
        <div className="bg-slate-100 border-b px-4 py-2">
          <TabsList className="grid grid-cols-2 w-48">
            <TabsTrigger value="edit">編集</TabsTrigger>
            <TabsTrigger value="preview">プレビュー</TabsTrigger>
          </TabsList>
          <div className="absolute right-4 top-2 flex gap-2">
            <Button variant="ghost" size="sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 mr-1"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              挿入
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
                className="h-4 w-4 mr-1"
              >
                <path d="M4 7V4h16v3" />
                <path d="M9 20h6" />
                <path d="M12 4v16" />
              </svg>
              フォーマット
            </Button>
          </div>
        </div>

        <TabsContent value="edit" className="m-0">
          <textarea
            className="w-full min-h-[500px] p-4 font-mono text-sm focus:outline-none resize-none"
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0 p-6 min-h-[500px]">
          <div className="prose max-w-none">
            {editorContent.split("\n").map((line, index) => {
              if (line.startsWith("# ")) {
                return (
                  <h1 key={index} className="text-xl font-bold">
                    {line.substring(2)}
                  </h1>
                )
              } else if (line.startsWith("## ")) {
                return (
                  <h2 key={index} className="text-lg font-semibold">
                    {line.substring(3)}
                  </h2>
                )
              } else if (line.startsWith("- ")) {
                return (
                  <li key={index} className="ml-5">
                    {line.substring(2)}
                  </li>
                )
              } else if (line === "") {
                return <br key={index} />
              } else {
                return <p key={index}>{line}</p>
              }
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
