import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// Node.jsランタイムを明示的に指定
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { documentId, materialType, options, userId } = await request.json()

    if (!documentId || !materialType || !userId) {
      return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 })
    }

    // ダミーのコンテンツを生成
    const content = `# サンプル教材 - ${getMaterialTypeLabel(materialType)}

このコンテンツはサンプルです。実際の実装では、AIによって生成されたコンテンツが表示されます。

## 主要ポイント
- これはサンプルの${getMaterialTypeLabel(materialType)}です
- 実際の教材はAIによって生成されます
- 環境変数が正しく設定されているか確認してください`

    // 生成された教材のIDを生成
    const materialId = uuidv4()

    return NextResponse.json({
      success: true,
      materialId: materialId,
      content,
      message: "教材が正常に生成されました",
    })
  } catch (error) {
    console.error("教材生成エラー:", error)
    return NextResponse.json(
      {
        error: "教材の生成中にエラーが発生しました",
        success: false,
        materialId: "error-id",
        content: `# エラーが発生しました\n\n申し訳ありませんが、教材の生成中にエラーが発生しました。もう一度お試しください。`,
      },
      { status: 200 }, // エラーでも200を返してクライアント側で処理できるようにする
    )
  }
}

// 教材タイプのラベルを取得する関数
function getMaterialTypeLabel(type: string): string {
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
