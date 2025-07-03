import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Node.jsランタイムを明示的に指定
export const runtime = "nodejs"

// Gemini APIを使用して教材を生成する関数
async function generateWithGemini(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.warn("Gemini API Keyが設定されていません。モック応答を返します。")
      return "APIキーが設定されていないため、サンプルコンテンツを表示しています。環境変数を設定してください。"
    }

    // GoogleGenerativeAIのインスタンスを作成
    const genAI = new GoogleGenerativeAI(apiKey)

    console.log("Gemini APIを使用して教材を生成します")

    // まずgemini-proモデルを使用（クォータ制限が緩い）
    try {
      console.log("gemini-proモデルを使用します")
      const model = genAI.getGenerativeModel({ model: "gemini-pro" })

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      })

      return result.response.text()
    } catch (proError) {
      console.error("gemini-proモデル呼び出しエラー:", proError)

      // クォータ超過エラーの場合は、すぐにDeepSeekにフォールバック
      if (proError.toString().includes("quota") || proError.toString().includes("429")) {
        console.log("クォータ超過エラー。DeepSeekにフォールバックします。")
        return await generateWithDeepSeek(prompt)
      }

      // その他のエラーの場合は、gemini-1.5-flashを試す
      try {
        console.log("gemini-1.5-flashモデルを試します")
        const flashModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const result = await flashModel.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        })

        return result.response.text()
      } catch (flashError) {
        console.error("gemini-1.5-flashモデル呼び出しエラー:", flashError)
        // DeepSeekにフォールバック
        return await generateWithDeepSeek(prompt)
      }
    }
  } catch (error) {
    console.error("Gemini API呼び出しエラー:", error)

    // エラーメッセージを詳細に記録
    if (error instanceof Error) {
      console.error("エラーの詳細:", error.message)
      console.error("エラーのスタックトレース:", error.stack)
    }

    // DeepSeekにフォールバック
    return await generateWithDeepSeek(prompt)
  }
}

// DeepSeek APIを使用して教材を生成する関数
async function generateWithDeepSeek(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY
    const apiBaseUrl = process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com/v1"

    if (!apiKey) {
      console.warn("DeepSeek API Keyが設定されていません。モック応答を返します。")
      return generateDummyResponse()
    }

    console.log("DeepSeek APIを使用して教材を生成します")

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-r1-chat",
        messages: [
          {
            role: "system",
            content:
              "あなたは教育専門家です。教材作成のエキスパートとして、高品質な教育コンテンツを作成します。特に医学教育に精通しており、正確で学習効果の高い教材を提供します。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error(`DeepSeek API error: ${JSON.stringify(errorData)}`)
      return generateDummyResponse()
    }

    const data = await response.json()
    return data.choices[0].message.content || generateDummyResponse()
  } catch (error) {
    console.error("DeepSeek API呼び出しエラー:", error)
    return generateDummyResponse()
  }
}

// ダミーの応答を生成する関数
function generateDummyResponse(): string {
  return `# サンプル教材

このコンテンツはサンプルです。APIの呼び出しに失敗したため、実際のテキストに基づいた教材は生成されていません。

## 主要ポイント
- これはサンプルのまとめシートです
- 環境変数が正しく設定されているか確認してください
- APIキーが有効であることを確認してください
- クォータ制限に達していないか確認してください`
}

// AIモデル用のプロンプトを構築する関数
function buildPrompt(text: string, materialType: string, options: any): string {
  const title = options.title || "教材"
  const difficulty = options.difficulty || "中"
  const subjectArea = options.subjectArea || "一般"

  // 元のテキストが長すぎる場合は切り詰める
  const maxLength = 8000
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + "...(以下省略)" : text

  // 教材タイプに応じたプロンプトを構築
  let promptTemplate = ""

  switch (materialType) {
    case "fill-in-blank":
      promptTemplate = `あなたは教育専門家です。以下のテキストから穴埋め問題を作成してください。
重要な用語や概念を空欄にして、学習者が理解度を確認できるようにしてください。

テキスト:
${truncatedText}

タイトル: ${title}
難易度: ${difficulty}
科目領域: ${subjectArea}

出力形式:
# [タイトル] - 穴埋めプリント

以下の文章の空欄に適切な言葉を入れなさい。

1. [穴埋め問題1]
2. [穴埋め問題2]
...

解答:
1. [解答1]
2. [解答2]
...`
      break

    case "summary":
      promptTemplate = `あなたは教育専門家です。以下のテキストの重要なポイントをまとめたシートを作成してください。
見出しと箇条書きを使って、内容を整理してください。

テキスト:
${truncatedText}

タイトル: ${title}
難易度: ${difficulty}
科目領域: ${subjectArea}

出力形式:
# [タイトル] - まとめシート

## 1. [セクション1のタイトル]
- [ポイント1]
- [ポイント2]
...

## 2. [セクション2のタイトル]
- [ポイント1]
- [ポイント2]
...`
      break

    case "quiz":
      promptTemplate = `あなたは教育専門家です。以下のテキストに基づいて、小テスト問題を作成してください。
選択問題と記述問題を混合し、学習者の理解度を測れるようにしてください。

テキスト:
${truncatedText}

タイトル: ${title}
難易度: ${difficulty}
科目領域: ${subjectArea}

出力形式:
# [タイトル] - 小テスト

以下の問題に答えなさい。

## 問1. [問題文]

a. [選択肢1]
b. [選択肢2]
c. [選択肢3]
d. [選択肢4]

## 問2. [問題文]
...

解答:
1. [正解]
2. [正解]
...`
      break

    default:
      promptTemplate = `あなたは教育専門家です。以下のテキストから${materialType}形式の教材を作成してください。

テキスト:
${truncatedText}

タイトル: ${title}
難易度: ${difficulty}
科目領域: ${subjectArea}

教材の内容は元のテキストに基づいて作成し、関係のない内容は含めないでください。`
  }

  return promptTemplate
}

export async function POST(request: Request) {
  try {
    const { text, materialType, options } = await request.json()

    if (!text || !materialType) {
      return NextResponse.json({ error: "テキストと教材タイプは必須です" }, { status: 400 })
    }

    // プロンプトを構築
    const prompt = buildPrompt(text, materialType, options)

    // まずGeminiを使用して教材を生成
    const content = await generateWithGemini(prompt)

    return NextResponse.json({ content, success: true })
  } catch (error) {
    console.error("API呼び出しエラー:", error)
    return NextResponse.json(
      {
        error: "教材生成中にエラーが発生しました",
        content: "エラーが発生しました。もう一度お試しください。",
        success: false,
      },
      { status: 200 }, // エラーでも200を返してクライアント側で処理できるようにする
    )
  }
}
