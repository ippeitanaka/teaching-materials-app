import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Node.jsランタイムを明示的に指定
export const runtime = "nodejs"

// Gemini 1.5 Flashモデルを使用して教材を生成する関数
async function generateWithGemini(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.warn("Gemini API Keyが設定されていません。ダミーレスポンスを返します。")
      return generateDummyResponse()
    }

    console.log("Gemini 1.5 Flash APIを使用して教材を生成します")

    // GoogleGenerativeAIをインスタンス化
    const genAI = new GoogleGenerativeAI(apiKey)

    try {
      console.log("gemini-1.5-flashモデルを使用します")
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

      const content = result.response.text()
      console.log("Gemini 1.5 Flash API応答成功")

      // 英語の思考プロセスを除去する
      return cleanResponse(content)
    } catch (error) {
      console.error("gemini-1.5-flashモデル呼び出しエラー:", error)
      return generateDummyResponse()
    }
  } catch (error) {
    console.error("Gemini API呼び出しエラー:", error)
    return generateDummyResponse()
  }
}

// DeepSeek APIを使用して教材を生成する関数
async function generateWithDeepSeek(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY
    const apiBaseUrl = process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com/v1"

    // 複数のモデルIDを試す - 最新のDeepSeekモデルIDを含む
    const modelIds = [
      "deepseek-v3-base", // DeepSeek V3 Base - 最新モデルを最優先
      "deepseek-v3", // DeepSeek V3の代替ID
      "deepseek-llm-7b-chat",
      "deepseek-chat-7b",
      "deepseek-llm",
      "deepseek-coder-6.7b-instruct",
      "deepseek-coder",
      "deepseek-chat",
      "deepseek-v2",
    ]

    if (!apiKey) {
      console.warn("DeepSeek API Keyが設定されていません。モック応答を返します。")
      return generateDummyResponse()
    }

    console.log("DeepSeek APIを使用して教材を生成します")

    // 最初のモデルIDで試行
    let lastError = null
    for (const modelId of modelIds) {
      try {
        console.log(`DeepSeek APIモデル ${modelId} を試行中...`)
        const response = await fetch(`${apiBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelId,
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
          console.error(`DeepSeek API error with model ${modelId}: ${JSON.stringify(errorData)}`)
          lastError = errorData
          // このモデルIDでエラーが発生したので次のモデルを試す
          continue
        }

        const data = await response.json()
        console.log(`DeepSeek APIモデル ${modelId} で成功しました`)
        return data.choices[0].message.content || generateDummyResponse()
      } catch (modelError) {
        console.error(`DeepSeek APIモデル ${modelId} 呼び出しエラー:`, modelError)
        lastError = modelError
        // このモデルIDでエラーが発生したので次のモデルを試す
        continue
      }
    }

    // すべてのモデルIDで失敗した場合
    console.error("すべてのDeepSeekモデルIDで失敗しました。最後のエラー:", lastError)

    // Geminiにフォールバック
    console.log("DeepSeekの呼び出しに失敗したため、Geminiにフォールバックします")
    return await generateWithGemini(prompt)
  } catch (error) {
    console.error("DeepSeek API呼び出しエラー:", error)
    // Geminiにフォールバック
    console.log("DeepSeekの呼び出しに失敗したため、Geminiにフォールバックします")
    return await generateWithGemini(prompt)
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
- DeepSeekまたはGemini APIへのアクセス権があることを確認してください

## オフラインモードでの使用方法
- テキストを手動で編集して教材を作成できます
- エディタ機能を使用して、自分で教材を作成してください
- 保存ボタンを使用して、作成した教材を保存できます`
}

// 応答から英語の部分や内部的な思考プロセスを除去する関数
function cleanResponse(content: string): string {
  // 最初に明らかな英語の思考プロセスを検出して削除
  const englishThoughtPatterns = [
    /We are .*?(?=\n\n)/s,
    /I am .*?(?=\n\n)/s,
    /You are .*?(?=\n\n)/s,
    /The user is asking:.*?(?=\n\n)/s,
    /Let's see.*?(?=\n\n)/s,
    /I need to produce.*?(?=\n\n)/s,
    /I can produce.*?(?=\n\n)/s,
    /I'll produce.*?(?=\n\n)/s,
    /Let me.*?(?=\n\n)/s,
    /Now, to produce.*?(?=\n\n)/s,
    /I will produce.*?(?=\n\n)/s,
    /The text appears to be.*?(?=\n\n)/s,
    /The text is.*?(?=\n\n)/s,
    /The output should be.*?(?=\n\n)/s,
    /So, I need to.*?(?=\n\n)/s,
  ]

  // 英語の思考プロセスを除去
  let cleanedContent = content
  for (const pattern of englishThoughtPatterns) {
    cleanedContent = cleanedContent.replace(pattern, "")
  }

  // 英語の指示文を除去
  cleanedContent = cleanedContent.replace(
    /^(We are|I am|You are|The user is asking|Let's see|I need to|I can|I'll|Let me|Now, to|I will|The text appears to be|The text is|The output should be|So, I need to).*?\n\n/s,
    "",
  )

  // 先頭の空行を削除
  cleanedContent = cleanedContent.replace(/^\s+/, "")

  // 最初の「#」から始まる行より前の英語テキストを削除
  const titleIndex = cleanedContent.indexOf("#")
  if (titleIndex > 0) {
    const beforeTitle = cleanedContent.substring(0, titleIndex).trim()
    if (/[a-zA-Z]/.test(beforeTitle)) {
      cleanedContent = cleanedContent.substring(titleIndex)
    }
  }

  // 行ごとに処理して、英語の行を削除
  const lines = cleanedContent.split("\n")
  const filteredLines = lines.filter((line) => {
    // 空行は保持
    if (line.trim() === "") return true

    // 日本語の文字が含まれている行は保持
    if (/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/.test(line)) return true

    // 記号や数字のみの行は保持
    if (!/[a-zA-Z]/.test(line)) return true

    // 英語の単語が含まれている行で、明らかに思考プロセスと思われるものを削除
    if (/\b(I|we|let's|need|must|should|will|can|could|would|let me|now|so|the text|the user|the output)\b/i.test(line))
      return false

    // 英語の文が5単語以上含まれる行は削除（思考プロセスの可能性が高い）
    const englishWordCount = (line.match(/\b[a-zA-Z]+\b/g) || []).length
    if (englishWordCount >= 5) return false

    // それ以外は保持
    return true
  })

  // 再度結合
  cleanedContent = filteredLines.join("\n")

  // 連続する空行を1つにまとめる
  cleanedContent = cleanedContent.replace(/\n{3,}/g, "\n\n")

  // 最終的な出力が「#」で始まることを確認（教材のタイトル）
  if (!cleanedContent.trim().startsWith("#")) {
    // タイトルがない場合は、デフォルトのタイトルを追加
    cleanedContent = "# 教材\n\n" + cleanedContent
  }

  return cleanedContent
}

// AIモデル用のプロンプトを構築する関数
function buildPrompt(text: string, materialType: string, options: any): string {
  const title = options.title || "教材"
  const difficulty = options.difficulty || "中"
  const subjectArea = options.subjectArea || "一般"

  // 元のテキストが長すぎる場合は切り詰める
  const maxLength = 3000 // プロンプトの長さをさらに短くする
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + "...(以下省略)" : text

  // 教材タイプに応じたプロンプトを構築
  let promptTemplate = ""

  switch (materialType) {
    case "fill-in-blank":
      const blankNumberType = options.blankNumberType || "numeric"
      const blankNumberPosition = options.blankNumberPosition || "after"
      const blankStyle = options.blankStyle || "underline"

      let blankExample = ""
      if (blankStyle === "underline") {
        blankExample =
          blankNumberPosition === "after"
            ? "_____（1）"
            : blankNumberPosition === "before"
              ? "（1）_____"
              : "  1\n_____"
      } else if (blankStyle === "box") {
        blankExample =
          blankNumberPosition === "after"
            ? "□□□□□（1）"
            : blankNumberPosition === "before"
              ? "（1）□□□□□"
              : "  1\n□□□□□"
      } else {
        blankExample =
          blankNumberPosition === "after"
            ? "（　　　　）（1）"
            : blankNumberPosition === "before"
              ? "（1）（　　　　）"
              : "  1\n（　　　　）"
      }

      promptTemplate = `あなたは教育専門家です。以下のテキストから穴埋め問題を作成してください。
重要: 必ず日本語のみで応答してください。英語や内部的な思考プロセスを含めないでください。直接日本語の教材コンテンツのみを出力してください。
重要な用語や概念を空欄にして、学習者が理解度を確認できるようにしてください。

空欄の形式は次のように設定してください：
- 番号タイプ: ${
        blankNumberType === "numeric"
          ? "数字 (1, 2, 3...)"
          : blankNumberType === "alphabetic"
            ? "アルファベット (a, b, c...)"
            : blankNumberType === "roman"
              ? "ローマ数字 (i, ii, iii...)"
              : "番号なし"
      }
- 番号位置: ${blankNumberPosition === "after" ? "空欄の後" : blankNumberPosition === "before" ? "空欄の前" : "空欄の上"}
- 空欄スタイル: ${blankStyle === "underline" ? "下線" : blankStyle === "box" ? "四角" : "かっこ"}

例: ${blankExample}

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
...

必ず指示された空欄の形式に従ってください。`
      break

    case "summary":
      promptTemplate = `あなたは教育専門家です。以下のテキストの重要なポイントをまとめたシートを作成してください。
重要: 必ず日本語のみで応答してください。英語や内部的な思考プロセスを含めないでください。直接日本語の教材コンテンツのみを出力してください。
見出しと箇条書きを使って、内容を整理してください。
必ず日本語のみで応答してください。英語や内部的な思考プロセスを含めないでください。

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
      const quizType = options.quizType || "mixed"
      let quizInstructions = ""

      switch (quizType) {
        case "descriptive":
          quizInstructions = `記述式問題のみを作成してください。各問題には、学習者が自分の言葉で回答できる形式にしてください。`
          break
        case "multiple-choice":
          quizInstructions = `5肢択一問題のみを作成してください。各問題には、1〜5の5つの選択肢を用意し、その中から正解を1つ選ぶ形式にしてください。`
          break
        case "mixed":
          quizInstructions = `記述式問題と選択式問題を混合して作成してください。選択式問題には、1〜5の5つの選択肢を用意してください。`
          break
      }

      promptTemplate = `あなたは教育専門家です。以下のテキストに基づいて、小テスト問題を作成してください。
重要: 必ず日本語のみで応答してください。英語や内部的な思考プロセスを含めないでください。直接日本語の教材コンテンツのみを出力してください。

${quizInstructions}

問題数: ${options.questionCount || 10}問

テキスト:
${truncatedText}

タイトル: ${title}
難易度: ${difficulty}
科目領域: ${subjectArea}

出力形式:
# [タイトル] - 小テスト

以下の問題に答えなさい。

## 問1. [問題文]
${
  quizType === "descriptive"
    ? ""
    : quizType === "multiple-choice"
      ? `1. [選択肢1]
2. [選択肢2]
3. [選択肢3]
4. [選択肢4]
5. [選択肢5]`
      : "[選択肢がある場合は記載]"
}

## 問2. [問題文]
...

解答:
1. [正解]
2. [正解]
...`
      break

    default:
      promptTemplate = `あなたは教育専門家です。以下のテキストから${materialType}形式の教材を作成してください。
重要: 必ず日本語のみで応答してください。英語や内部的な思考プロセスを含めないでください。直接日本語の教材コンテンツのみを出力してください。
必ず日本語のみで応答してください。英語や内部的な思考プロセスを含めないでください。

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

    // APIプロバイダーを確認
    const apiProvider = options.apiProvider || "gemini"

    let content = ""
    if (apiProvider === "deepseek") {
      // DeepSeek APIを使用
      content = await generateWithDeepSeek(prompt)
    } else {
      // Gemini APIをデフォルトとして使用
      content = await generateWithGemini(prompt)
    }

    return NextResponse.json({ content, success: true })
  } catch (error) {
    console.error("API呼び出しエラー:", error)
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message)
      console.error("エラースタック:", error.stack)
    }

    return NextResponse.json(
      {
        error: "教材生成中にエラーが発生しました",
        content: `エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}. もう一度お試しください。`,
        success: false,
      },
      { status: 200 },
    )
  }
}
