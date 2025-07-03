import { NextResponse } from "next/server"

// Node.jsランタイムを明示的に指定
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const title = formData.get("title") as string
    const documentId = formData.get("documentId") as string

    if (!file || !userId || !documentId) {
      return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 })
    }

    // サンプルのテキスト抽出結果
    const extractedText =
      "これはファイルから抽出されたサンプルテキストです。実際の実装では、PDFや画像からテキストが抽出されます。"

    return NextResponse.json({
      success: true,
      documentId: documentId,
      extractedText: extractedText,
      message: "ファイルが正常に処理されました",
    })
  } catch (error) {
    console.error("ファイル処理エラー:", error)
    return NextResponse.json(
      {
        error: "ファイルの処理中にエラーが発生しました",
        success: false,
        documentId: "error-id",
        extractedText: "エラーが発生しました。もう一度お試しください。",
      },
      { status: 200 }, // エラーでも200を返してクライアント側で処理できるようにする
    )
  }
}
