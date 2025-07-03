// PDF.jsを使用してPDFからテキストを抽出する実装
import { createWorker } from "tesseract.js"

// PDFからテキストを抽出する関数
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // ブラウザ環境でのみ実行
    if (typeof window === "undefined") {
      return "サーバーサイドではPDF処理を実行できません。"
    }

    // PDF.jsをCDNから動的にロード
    if (!window.pdfjsLib) {
      await loadPdfJs()
    }

    // FileReaderでファイルを読み込む
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })

    try {
      // PDF.jsを使用してPDFを解析
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let extractedText = ""

      // 各ページからテキストを抽出
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .trim()
        extractedText += pageText + "\n\n"
      }

      if (extractedText.trim().length > 0) {
        return extractedText
      }

      // テキスト抽出に失敗した場合は、OCRを試みる
      return "PDFからテキストを直接抽出できませんでした。画像ベースのPDFの可能性があります。OCR処理を試みてください。"
    } catch (pdfError) {
      console.error("PDF解析エラー:", pdfError)

      // PDF.jsでの抽出に失敗した場合のフォールバック処理
      return `PDFの解析中にエラーが発生しました。以下のいずれかの方法をお試しください：
1. テキストを含む別のPDFをアップロードする
2. テキストをコピー＆ペーストで直接入力する
3. 画像としてスキャンしたPDFの場合は、画像としてアップロードしてOCR処理を試す`
    }
  } catch (error) {
    console.error("PDFテキスト抽出エラー:", error)

    // エラーが発生した場合のフォールバック処理
    return "PDFの処理中にエラーが発生しました。テキスト中心のPDFを使用するか、テキストを手動で入力してください。"
  }
}

// PDF.jsをCDNから動的にロードする関数
async function loadPdfJs() {
  return new Promise<void>((resolve, reject) => {
    // PDF.jsのCDNスクリプトを追加
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    script.onload = () => {
      // PDF.jsのワーカーを設定
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
      resolve()
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// グローバル型定義の拡張
declare global {
  interface Window {
    pdfjsLib: any
  }
}

// 画像からテキストを抽出する関数（OCR）
export async function extractTextFromImage(file: File): Promise<string> {
  try {
    // ブラウザ環境でのみ実行
    if (typeof window === "undefined") {
      return "サーバーサイドでは画像処理を実行できません。"
    }

    // Tesseract.jsワーカーを作成
    const worker = await createWorker("jpn+eng")

    // 画像をDataURLに変換
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    // OCR処理を実行
    const { data } = await worker.recognize(dataUrl)
    await worker.terminate()

    if (data.text && data.text.trim().length > 0) {
      return data.text
    }

    return "テキストが認識できませんでした。より鮮明な画像をお試しください。"
  } catch (error) {
    console.error("画像テキスト抽出エラー:", error)
    return "画像の処理中にエラーが発生しました。より鮮明な画像を使用するか、テキストを手動で入力してください。"
  }
}

// テキストの内容を分析して適切な教材タイプを推奨する関数
export async function analyzeTextContent(text: string): Promise<{
  recommendedType: string
  subjectArea: string
  complexity: number
  keyTerms: string[]
}> {
  try {
    // テキストの長さに基づく複雑さの推定
    const complexity = Math.min(100, Math.max(0, text.length / 100))

    // キーワードの抽出と科目領域の推定
    const keyTerms: string[] = []
    let subjectArea = "一般"

    // 医学関連の用語
    const medicalTerms = [
      "意識障害",
      "頭痛",
      "痙攣",
      "運動麻痺",
      "めまい",
      "呼吸困難",
      "喀血",
      "失神",
      "胸痛",
      "動悸",
      "腹痛",
      "吐血",
      "下血",
      "腰痛",
      "背部痛",
      "体温上昇",
      "脳",
      "心臓",
      "肺",
      "肝臓",
      "腎臓",
      "胃",
      "腸",
      "血管",
      "神経",
      "筋肉",
      "細胞",
      "組織",
      "器官",
      "システム",
      "代謝",
      "ホルモン",
      "免疫",
      "遺伝子",
      "脳血管障害",
      "脳出血",
      "くも膜下出血",
      "脳梗塞",
      "髄膜炎",
      "脳炎",
      "脳症",
      "低血糖",
      "高血糖",
      "ショック",
      "昏睡",
      "JCS",
      "GCS",
      "瞳孔",
      "対光反射",
      "バイタルサイン",
      "血圧",
      "脈拍",
      "呼吸",
      "体温",
      "一次性脳病変",
      "二次性脳病変",
    ]

    // 数学関連の用語
    const mathTerms = [
      "数式",
      "方程式",
      "関数",
      "微分",
      "積分",
      "幾何",
      "代数",
      "証明",
      "定理",
      "確率",
      "統計",
      "ベクトル",
      "行列",
      "集合",
      "論理",
      "グラフ",
    ]

    // 歴史・社会関連の用語
    const historyTerms = [
      "歴史",
      "時代",
      "世紀",
      "王",
      "戦争",
      "条約",
      "革命",
      "文明",
      "古代",
      "中世",
      "近代",
      "政治",
      "経済",
      "社会",
      "文化",
      "宗教",
      "哲学",
      "思想",
      "芸術",
    ]

    // 言語関連の用語
    const languageTerms = [
      "文法",
      "単語",
      "動詞",
      "名詞",
      "形容詞",
      "構文",
      "発音",
      "語彙",
      "読解",
      "文学",
      "詩",
      "小説",
      "物語",
      "著者",
      "作家",
      "表現",
    ]

    // テキスト内の用語をカウント
    let medicalCount = 0
    let mathCount = 0
    let historyCount = 0
    let languageCount = 0

    // 各分野の用語をチェック
    medicalTerms.forEach((term) => {
      if (text.includes(term)) {
        medicalCount++
        if (!keyTerms.includes(term)) {
          keyTerms.push(term)
        }
      }
    })

    mathTerms.forEach((term) => {
      if (text.includes(term)) {
        mathCount++
        if (!keyTerms.includes(term)) {
          keyTerms.push(term)
        }
      }
    })

    historyTerms.forEach((term) => {
      if (text.includes(term)) {
        historyCount++
        if (!keyTerms.includes(term)) {
          keyTerms.push(term)
        }
      }
    })

    languageTerms.forEach((term) => {
      if (text.includes(term)) {
        languageCount++
        if (!keyTerms.includes(term)) {
          keyTerms.push(term)
        }
      }
    })

    // 最も多くの用語が見つかった分野を選択
    const maxCount = Math.max(medicalCount, mathCount, historyCount, languageCount)
    if (maxCount > 0) {
      if (medicalCount === maxCount) subjectArea = "医学・科学"
      else if (mathCount === maxCount) subjectArea = "数学"
      else if (historyCount === maxCount) subjectArea = "歴史・社会"
      else if (languageCount === maxCount) subjectArea = "言語・文学"
    }

    // 医学テキストの特徴的なパターンを検出
    if (text.includes("疾患") || text.includes("症状") || text.includes("診断") || text.includes("治療") || 
        text.includes("病変") || text.includes("障害") || text.includes("症候群")) {
      subjectArea = "医学・科学"
    }

    // テキストの特性に基づいて推奨教材タイプを決定
    let recommendedType = "summary" // デフォルトはまとめシート

    // 医学テキストの場合は特別な処理
    if (subjectArea === "医学・科学") {
      // 医学テキストの特徴を分析
      if (text.includes("到達目標") || text.includes("学習目標")) {
        recommendedType = "fill-in-blank" // 学習目標があれば穴埋めプリントが適している
      } else if (text.includes("問題") || text.includes("解答") || text.includes("答えなさい")) {
        recommendedType = "quiz" // 問題形式のテキストの場合は小テストが適している
      } else if (keyTerms.length > 10) {
        recommendedType = "flashcards" // 多くの医学用語を含む場合はフラッシュカードが適している
      } else if (text.length > 5000) {
        recommendedType = "assignment" // 長いテキストの場合は課題が適している
      }
    } else {
      // 一般的なテキスト分析
      if (text.length < 1000) {
        // 短いテキストの場合はフラッシュカードが適している
        recommendedType = "flashcards"
      } else if (text.includes("問題") || text.includes("解答") || text.includes("答えなさい")) {
        // 問題形式のテキストの場合は小テストが適している
        recommendedType = "quiz"
      } else if (keyTerms.length > 10) {
        // 多くの重要用語を含む場合は穴埋めプリントが適している
        recommendedType = "fill-in-blank"
      } else if (text.length > 5000) {
        // 長いテキストの場合は課題が適している
        recommendedType = "assignment"
      }
    }

    // 医学テキストの場合、特に重要な用語を抽出
    if (subjectArea === "医学・科学") {
      // 重要な医学用語を正規表現で抽出
      const medicalTermRegex = /[ぁ-んァ-ン一-龥]+[障害|疾患|症候群|病変|病態|症状|診断|治療]/g
      const matches = text.match(medicalTermRegex) || []
      
      // 既存のkeyTermsに追加（重複を避ける）
      matches.forEach(term => {
        if (!keyTerms.includes(term)) {
          keyTerms.push(term)
        }
      })
    }

    return {
      recommendedType,
      subjectArea,
      complexity,
      keyTerms: keyTerms.slice(0, 15), // 最大15個のキーワードを返す
    }
  } catch (error) {
    console.error("テキスト分析エラー:", error)
    // エラーが発生した場合はデフォルト値を返す
    return {
      recommendedType: "summary",
      subjectArea: "一般",
      complexity: 50,
      keyTerms: [],
    }
  }
}
