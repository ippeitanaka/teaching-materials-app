import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Node.jsランタイムを明示的に指定
export const runtime = "nodejs"

class AiProviderError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = "AiProviderError"
  }
}

// Gemini 1.5 Flashモデルを使用して教材を生成する関数
async function generateWithGemini(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new AiProviderError(
        "MISSING_GEMINI_API_KEY",
        "Gemini APIキーが未設定です。Vercelの環境変数 GEMINI_API_KEY を設定してください。",
      )
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
      throw new AiProviderError("GEMINI_REQUEST_FAILED", "Gemini API呼び出しに失敗しました。")
    }
  } catch (error) {
    console.error("Gemini API呼び出しエラー:", error)
    if (error instanceof AiProviderError) {
      throw error
    }
    throw new AiProviderError("GEMINI_UNKNOWN_ERROR", "Gemini API呼び出し中に予期しないエラーが発生しました。")
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
      throw new AiProviderError(
        "MISSING_DEEPSEEK_API_KEY",
        "DeepSeek APIキーが未設定です。Vercelの環境変数 DEEPSEEK_API_KEY を設定してください。",
      )
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
        const message = data?.choices?.[0]?.message?.content
        if (!message) {
          throw new AiProviderError("DEEPSEEK_EMPTY_RESPONSE", "DeepSeek APIから有効な応答が返されませんでした。")
        }
        return message
      } catch (modelError) {
        console.error(`DeepSeek APIモデル ${modelId} 呼び出しエラー:`, modelError)
        lastError = modelError
        // このモデルIDでエラーが発生したので次のモデルを試す
        continue
      }
    }

    console.error("すべてのDeepSeekモデルIDで失敗しました。最後のエラー:", lastError)
    throw new AiProviderError("DEEPSEEK_ALL_MODELS_FAILED", "DeepSeek APIの全モデル呼び出しに失敗しました。")
  } catch (error) {
    console.error("DeepSeek API呼び出しエラー:", error)
    if (error instanceof AiProviderError) {
      throw error
    }
    throw new AiProviderError("DEEPSEEK_UNKNOWN_ERROR", "DeepSeek API呼び出し中に予期しないエラーが発生しました。")
  }
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

function sanitizeTextForPrompt(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function buildRepresentativeText(text: string, maxLength = 5500): string {
  const normalized = sanitizeTextForPrompt(text)
  if (normalized.length <= maxLength) return normalized

  const headSize = Math.floor(maxLength * 0.45)
  const middleSize = Math.floor(maxLength * 0.2)
  const tailSize = maxLength - headSize - middleSize
  const middleStart = Math.max(0, Math.floor(normalized.length / 2 - middleSize / 2))

  const head = normalized.slice(0, headSize)
  const middle = normalized.slice(middleStart, middleStart + middleSize)
  const tail = normalized.slice(-tailSize)

  return `${head}\n\n...(中略)...\n\n${middle}\n\n...(中略)...\n\n${tail}`
}

function getDifficultyGuide(difficulty: string): string {
  if (difficulty === "初級") {
    return "短文・平易語彙・定義中心。1問1概念で混乱を避ける。"
  }
  if (difficulty === "上級") {
    return "比較・因果・応用を含め、複数概念の統合を問う。曖昧表現を避ける。"
  }
  return "基本概念に加えて理由説明や関連付けを含める。"
}

function validateGeneratedContent(materialType: string, content: string, options: any): {
  valid: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  const lines = content.split("\n")
  const questionLines = lines.filter((line) => /^\s*(\d+\.|##\s*問\d+)/.test(line)).length
  const sectionLines = lines.filter((line) => /^\s*##\s+/.test(line)).length

  if (!content.trim().startsWith("#")) {
    reasons.push("タイトル見出し(#)が不足しています")
  }

  if (materialType === "fill-in-blank") {
    const expected = Math.max(1, Number(options.questionCount || 10))
    const blankCount = (content.match(/_____|□□□□□|（　　　　）/g) || []).length
    if (blankCount < Math.max(3, Math.floor(expected * 0.5))) {
      reasons.push("穴埋めの空欄が不足しています")
    }
  }

  if (materialType === "quiz") {
    const expected = Math.max(1, Number(options.questionCount || 10))
    if (questionLines < Math.max(3, Math.floor(expected * 0.5))) {
      reasons.push("問題数が不足しています")
    }
    if (!content.includes("解答")) {
      reasons.push("解答セクションが不足しています")
    }
  }

  if (materialType === "summary") {
    const expectedSections = Math.max(2, Number(options.sectionCount || 5))
    if (sectionLines < Math.max(2, Math.floor(expectedSections * 0.6))) {
      reasons.push("見出しセクション数が不足しています")
    }
  }

  if (materialType === "assignment") {
    const expected = Math.max(1, Number(options.assignmentCount || 3))
    if (questionLines < Math.max(1, Math.floor(expected * 0.6))) {
      reasons.push("課題数が不足しています")
    }
  }

  if (materialType === "flashcards") {
    const expected = Math.max(5, Number(options.cardCount || 15))
    const cardLines = lines.filter((line) => /^\s*(\d+\.|-\s*Q[:：]|Q[:：])/i.test(line)).length
    if (cardLines < Math.max(5, Math.floor(expected * 0.5))) {
      reasons.push("カード数が不足しています")
    }
  }

  return { valid: reasons.length === 0, reasons }
}

async function generateWithProvider(apiProvider: string, prompt: string): Promise<string> {
  if (apiProvider === "deepseek") {
    try {
      return await generateWithDeepSeek(prompt)
    } catch (error) {
      if (error instanceof AiProviderError && error.code === "MISSING_DEEPSEEK_API_KEY") {
        return generateWithGemini(prompt)
      }
      throw error
    }
  }
  return generateWithGemini(prompt)
}

// AIモデル用のプロンプトを構築する関数
function buildPrompt(text: string, materialType: string, options: any): string {
  const title = options.title || "教材"
  const difficulty = options.difficulty || "中"
  const subjectArea = options.subjectArea || "一般"
  const questionCount = Math.min(100, Math.max(1, Number(options.questionCount || 10)))
  const sectionCount = Math.min(15, Math.max(2, Number(options.sectionCount || 5)))
  const assignmentCount = Math.min(20, Math.max(1, Number(options.assignmentCount || 3)))
  const cardCount = Math.min(50, Math.max(5, Number(options.cardCount || 15)))

  const truncatedText = buildRepresentativeText(text, 5500)
  const keyTerms = Array.isArray(options.keyTerms) ? options.keyTerms.slice(0, 20) : []
  const keyTermsText = keyTerms.length ? keyTerms.join("、") : "（抽出なし）"
  const difficultyGuide = getDifficultyGuide(difficulty)
  const baseInstruction = `あなたは日本語で教材を作る教育設計者です。以下を厳守してください。
- 出力は日本語のみ（英語、思考過程、メタ説明は禁止）
- 元テキストに忠実で、事実の創作をしない
- Markdown形式で出力
- 難易度方針: ${difficultyGuide}`

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
    ${baseInstruction}
    重要語・重要概念を中心に、学習者が理解確認できる穴埋め問題を作成してください。

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
      - 問題数: ${questionCount}問

例: ${blankExample}

テキスト:
${truncatedText}

タイトル: ${title}
難易度: ${difficulty}
科目領域: ${subjectArea}
キーワード: ${keyTermsText}

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
  promptTemplate = `あなたは教育専門家です。以下のテキストの重要ポイントを、学習に使いやすいまとめシートとして再構成してください。
${baseInstruction}
- セクション数は${sectionCount}前後
- 各セクションは「要点3〜5項目」と「授業での注意点1つ」を含める
- 定義と因果関係を優先

テキスト:
${truncatedText}

タイトル: ${title}
難易度: ${difficulty}
科目領域: ${subjectArea}
キーワード: ${keyTermsText}

出力形式:
# [タイトル] - まとめシート

## 1. [セクション1のタイトル]
- [ポイント1]
- [ポイント2]
- 授業での注意点: [注意点]
...

## 2. [セクション2のタイトル]
- [ポイント1]
- [ポイント2]
- 授業での注意点: [注意点]
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
${baseInstruction}
- 計算問題や暗記問題だけに偏らず、理解確認問題を含める
- ひっかけ問題は禁止

${quizInstructions}

問題数: ${questionCount}問

テキスト:
${truncatedText}

タイトル: ${title}
難易度: ${difficulty}
科目領域: ${subjectArea}
キーワード: ${keyTermsText}

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
...

解説:
1. [1〜2文の簡潔な解説]
2. [1〜2文の簡潔な解説]
...`
      break

    case "assignment":
  promptTemplate = `あなたは教育専門家です。以下のテキストに基づいて、授業用の課題を作成してください。
${baseInstruction}
- 課題数: ${assignmentCount}題
- 課題は「基礎」「応用」「振り返り」をバランスよく含める
- 各課題に評価観点を添える

テキスト:
${truncatedText}

タイトル: ${title}
難易度: ${difficulty}
科目領域: ${subjectArea}
キーワード: ${keyTermsText}

出力形式:
# [タイトル] - 課題

## 課題1. [課題タイトル]
[課題文]
- 評価観点: [観点]

## 課題2. [課題タイトル]
[課題文]
- 評価観点: [観点]`
  break

    case "flashcards":
  promptTemplate = `あなたは教育専門家です。以下のテキストを、暗記と理解確認の両方に使えるフラッシュカードへ変換してください。
${baseInstruction}
- カード枚数: ${cardCount}枚
- 重要語の定義、比較、適用例をバランスよく含める

テキスト:
${truncatedText}

タイトル: ${title}
難易度: ${difficulty}
科目領域: ${subjectArea}
キーワード: ${keyTermsText}

出力形式:
# [タイトル] - フラッシュカード

1. Q: [問い]
   A: [答え]
2. Q: [問い]
   A: [答え]`
  break

    default:
      promptTemplate = `あなたは教育専門家です。以下のテキストから${materialType}形式の教材を作成してください。
${baseInstruction}

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
    const normalizedOptions = {
      ...options,
      questionCount: Math.min(100, Math.max(1, Number(options?.questionCount || 10))),
      sectionCount: Math.min(15, Math.max(2, Number(options?.sectionCount || 5))),
      assignmentCount: Math.min(20, Math.max(1, Number(options?.assignmentCount || 3))),
      cardCount: Math.min(50, Math.max(5, Number(options?.cardCount || 15))),
    }
    const prompt = buildPrompt(text, materialType, normalizedOptions)

    // APIプロバイダーを確認
    const apiProvider = normalizedOptions.apiProvider || "gemini"

    let content = await generateWithProvider(apiProvider, prompt)
    content = cleanResponse(content)

    const qualityCheck = validateGeneratedContent(materialType, content, normalizedOptions)
    if (!qualityCheck.valid) {
      const retryPrompt = `${prompt}\n\n前回の出力の問題点: ${qualityCheck.reasons.join("、")}\n上記を修正し、要件を満たす教材を再生成してください。`
      const retried = await generateWithProvider(apiProvider, retryPrompt)
      const cleanedRetried = cleanResponse(retried)
      const retryCheck = validateGeneratedContent(materialType, cleanedRetried, normalizedOptions)
      if (retryCheck.valid) {
        content = cleanedRetried
      }
    }

    return NextResponse.json({ content, success: true })
  } catch (error) {
    console.error("API呼び出しエラー:", error)
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message)
      console.error("エラースタック:", error.stack)
    }

    const safeMessage =
      error instanceof AiProviderError
        ? error.message
        : "教材生成中にエラーが発生しました。環境変数とAPIアクセス設定を確認してください。"

    return NextResponse.json(
      {
        error: safeMessage,
        content: "",
        success: false,
      },
      { status: 200 },
    )
  }
}
