// クライアント側でAI生成を行うためのヘルパー関数

/**
 * サーバーサイドAPIを使用して教材を生成する関数
 */
export async function generateMaterialWithAI(text: string, materialType: string, options: any = {}): Promise<string> {
  try {
    // テキストが長すぎる場合は適切な長さに切り詰める
    const maxLength = 8000 // APIの制限に合わせて調整
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + "...(以下省略)" : text

    // API呼び出し
    try {
      console.log("AI APIリクエスト開始")

      // 指定されたAPIプロバイダーまたはデフォルトのプロバイダーを使用
      const apiProvider = options.apiProvider || "gemini"
      console.log(`使用するAPIプロバイダー: ${apiProvider}`)

      const response = await fetch("/api/generate-with-openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: truncatedText,
          materialType,
          options: {
            ...options,
            apiProvider,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API応答エラー (${response.status}):`, errorText)
        throw new Error(`API応答エラー (${response.status})`) 
      }

      const data = await response.json()

      // APIからの応答を受け取った後、英語の部分を除去する
      if (data.success) {
        console.log("API応答成功")
        // 英語の部分を除去する
        return cleanResponse(data.content)
      }

      // 成功しなかった場合はエラーメッセージを表示
      console.log("APIでの生成に失敗しました:", data.error || "不明なエラー")
      throw new Error(data.error || "教材生成に失敗しました")
    } catch (error) {
      console.error("API呼び出しエラー:", error)
      if (error instanceof Error) {
        console.error("エラーメッセージ:", error.message)
        console.error("エラースタック:", error.stack)
      }
      throw error instanceof Error ? error : new Error("API呼び出しに失敗しました")
    }
  } catch (error) {
    console.error("AI生成エラー:", error)
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message)
      console.error("エラースタック:", error.stack)
    }

    throw new Error(`AI生成エラー: ${error instanceof Error ? error.message : "不明なエラー"}`)
  }
}

// ダミーの応答を生成する関数
function generateDummyResponse(materialType: string, options: any, inputText = ""): string {
  // テキストの先頭部分を取得（長すぎる場合は切り詰める）
  const truncatedText = inputText.length > 500 ? inputText.substring(0, 500) + "..." : inputText || "サンプルテキスト"

  const title = options.title || "サンプル教材"
  const subjectArea = options.subjectArea || "一般"

  switch (materialType) {
    case "fill-in-blank":
      // 空欄スタイルと番号の設定を取得
      const blankNumberType = options.blankNumberType || "numeric"
      const blankNumberPosition = options.blankNumberPosition || "after"
      const blankStyle = options.blankStyle || "underline"

      // 空欄と番号の例を生成
      let blank1 = "",
        blank2 = "",
        blank3 = ""

      if (blankStyle === "underline") {
        if (blankNumberPosition === "after") {
          blank1 = "_____（1）"
          blank2 = "_____（2）"
          blank3 = "_____（3）"
        } else if (blankNumberPosition === "before") {
          blank1 = "（1）_____"
          blank2 = "（2）_____"
          blank3 = "（3）_____"
        } else {
          // above
          blank1 = "  1\n_____"
          blank2 = "  2\n_____"
          blank3 = "  3\n_____"
        }
      } else if (blankStyle === "box") {
        if (blankNumberPosition === "after") {
          blank1 = "□□□□□（1）"
          blank2 = "□□□□□（2）"
          blank3 = "□□□□□（3）"
        } else if (blankNumberPosition === "before") {
          blank1 = "（1）□□□□□"
          blank2 = "（2）□□□□□"
          blank3 = "（3）□□□□□"
        } else {
          // above
          blank1 = "  1\n□□□□□"
          blank2 = "  2\n□□□□□"
          blank3 = "  3\n□□□□□"
        }
      } else {
        // parentheses
        if (blankNumberPosition === "after") {
          blank1 = "（　　　　）（1）"
          blank2 = "（　　　　）（2）"
          blank3 = "（　　　　）（3）"
        } else if (blankNumberPosition === "before") {
          blank1 = "（1）（　　　　）"
          blank2 = "（2）（　　　　）"
          blank3 = "（3）（　　　　）"
        } else {
          // above
          blank1 = "  1\n（　　　　）"
          blank2 = "  2\n（　　　　）"
          blank3 = "  3\n（　　　　）"
        }
      }

      return `# ${title} - 穴埋めプリント

科目領域: ${subjectArea}

以下の文章の空欄に適切な言葉を入れなさい。

1. 医学教育において重要なのは${blank1}と${blank2}のバランスである。
2. 教材作成では、学習者の${blank3}に合わせた内容設計が重要である。

解答:
1. 正確性、実用性
2. 理解度

注意: これはオフラインモードのサンプルです。エディタ機能を使用して、このテンプレートを編集し、独自の教材を作成できます。

元のテキスト（一部）:
${truncatedText.substring(0, 200)}...`

    case "summary":
      return `# ${title} - まとめシート

科目領域: ${subjectArea}

## 1. 概要
- これはオフラインモードのサンプルまとめシートです
- エディタ機能を使用して、このテンプレートを編集できます
- 独自の教材を作成し、保存することができます

## 2. 主要ポイント
- サンプルポイント1
- サンプルポイント2
- サンプルポイント3

## 3. 元のテキスト（一部）
${truncatedText.substring(0, 200)}...

注意: これはオフラインモードのサンプルです。エディタ機能を使用して、このテンプレートを編集し、独自の教材を作成できます。`

    case "quiz":
      const quizType = options.quizType || "mixed"
      let quizContent = ""

      if (quizType === "descriptive") {
        quizContent = `## 問1. 医学教育において最も重要な要素は何ですか？具体的に説明してください。

## 問2. 教材作成において考慮すべき点を3つ挙げ、それぞれについて簡潔に説明してください。

## 問3. 効果的な学習方法について、あなたの考えを述べてください。

解答:
1. 医学教育において最も重要な要素は、正確性と実用性のバランスです。医学知識は常に更新されるため、最新の情報を正確に伝えつつ、臨床現場で実際に役立つ知識や技術を教えることが重要です。
2. 教材作成において考慮すべき点は、(1)学習者の理解度に合わせた内容設計、(2)明確な学習目標の設定、(3)効果的な評価方法の組み込みです。
3. （学習者の回答による）`
      } else if (quizType === "multiple-choice") {
        quizContent = `## 問1. 医学教育で最も重要な要素は何ですか？

1) 最新技術の導入
2) 正確性と実用性のバランス
3) 豊富な教材の提供
4) 優秀な講師の確保
5) 高度な設備の整備

## 問2. 教材作成において最も考慮すべき点は何ですか？

1) 美しいデザイン
2) 学習者の理解度
3) 教材の長さ
4) 流行のトピック
5) 印刷品質

## 問3. 効果的な学習方法として最も適切なものはどれですか？

1) 長時間の一括学習
2) 暗記中心の学習
3) 分散学習と定期的な復習
4) 試験直前の集中学習
5) 教科書の通読

解答:
1. 2
2. 2
3. 3`
      } else {
        quizContent = `## 問1. 医学教育で最も重要な要素は何ですか？

1) 最新技術の導入
2) 正確性と実用性のバランス
3) 豊富な教材の提供
4) 優秀な講師の確保
5) 高度な設備の整備

## 問2. 教材作成において考慮すべき点を3つ挙げ、それぞれについて簡潔に説明してください。

## 問3. 効果的な学習方法として最も適切なものはどれですか？

1) 長時間の一括学習
2) 暗記中心の学習
3) 分散学習と定期的な復習
4) 試験直前の集中学習
5) 教科書の通読

解答:
1. 2
2. 教材作成において考慮すべき点は、(1)学習者の理解度に合わせた内容設計、(2)明確な学習目標の設定、(3)効果的な評価方法の組み込みです。
3. 3`
      }

      return `# ${title} - 小テスト

科目領域: ${subjectArea}

以下の問題に答えなさい。

${quizContent}

注意: これはオフラインモードのサンプルです。エディタ機能を使用して、このテンプレートを編集し、独自の教材を作成できます。

元のテキスト（一部）:
${truncatedText.substring(0, 200)}...`

    default:
      return `# ${title}

科目領域: ${subjectArea}

## オフラインモードのサンプル教材

このコンテンツはオフラインモードのサンプルです。エディタ機能を使用して、このテンプレートを編集し、独自の教材を作成できます。

## 使用方法
1. エディタタブを選択して、このテキストを編集します
2. 教材の内容を自由に追加・変更できます
3. 保存ボタンを使用して、作成した教材を保存します

## 元のテキスト（一部）
${truncatedText.substring(0, 200)}...`
  }
}

// 応答から英語の部分を除去する関数
function cleanResponse(content: string): string {
  // 行ごとに処理して、英語の行を削除
  const lines = content.split("\n")
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
  let cleanedContent = filteredLines.join("\n")

  // 連続する空行を1つにまとめる
  cleanedContent = cleanedContent.replace(/\n{3,}/g, "\n\n")

  // 最終的な出力が「#」で始まることを確認（教材のタイトル）
  if (!cleanedContent.trim().startsWith("#")) {
    // タイトルがない場合は、デフォルトのタイトルを追加
    cleanedContent = "# 教材\n\n" + cleanedContent
  }

  return cleanedContent
}
