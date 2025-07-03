// データベース接続とモデルの定義

// ユーザーモデル
export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

// 資料モデル
export interface Document {
  id: string
  userId: string
  title: string
  fileUrl: string
  fileType: string
  extractedText: string
  createdAt: Date
}

// 教材モデル
export interface Material {
  id: string
  userId: string
  documentId: string
  title: string
  type: string // "fill-in-blank", "summary", "quiz", "assignment", "flashcards"
  content: string
  options: any // 教材生成時のオプション
  createdAt: Date
  updatedAt: Date
}

// テンプレートモデル
export interface Template {
  id: string
  userId: string
  name: string
  type: string
  options: any
  createdAt: Date
}

// ダミーデータを取得する関数（実際の実装ではデータベースからデータを取得する）
export async function getDocuments(userId: string): Promise<Document[]> {
  // ダミーデータ
  return [
    {
      id: "1",
      userId,
      title: "物理学基礎講義",
      fileUrl: "/files/physics.pdf",
      fileType: "application/pdf",
      extractedText: "物理学の基礎についての講義資料...",
      createdAt: new Date("2025-04-25"),
    },
    {
      id: "2",
      userId,
      title: "化学実験レポート",
      fileUrl: "/files/chemistry.pdf",
      fileType: "application/pdf",
      extractedText: "化学実験の手順とレポート...",
      createdAt: new Date("2025-04-23"),
    },
  ]
}

export async function getMaterials(userId: string, documentId?: string): Promise<Material[]> {
  // ダミーデータ
  const materials = [
    {
      id: "1",
      userId,
      documentId: "1",
      title: "物理学基礎 - 穴埋めプリント",
      type: "fill-in-blank",
      content: "物理学の穴埋め問題...",
      options: { difficulty: "medium" },
      createdAt: new Date("2025-04-25"),
      updatedAt: new Date("2025-04-25"),
    },
    {
      id: "2",
      userId,
      documentId: "1",
      title: "物理学基礎 - 小テスト",
      type: "quiz",
      content: "物理学の小テスト問題...",
      options: { difficulty: "medium" },
      createdAt: new Date("2025-04-25"),
      updatedAt: new Date("2025-04-25"),
    },
    {
      id: "3",
      userId,
      documentId: "2",
      title: "化学実験 - 穴埋めプリント",
      type: "fill-in-blank",
      content: "化学実験の穴埋め問題...",
      options: { difficulty: "medium" },
      createdAt: new Date("2025-04-23"),
      updatedAt: new Date("2025-04-23"),
    },
  ]

  if (documentId) {
    return materials.filter((m) => m.documentId === documentId)
  }

  return materials
}

export async function getTemplates(userId: string): Promise<Template[]> {
  // ダミーデータ
  return [
    {
      id: "1",
      userId,
      name: "標準穴埋めプリント",
      type: "fill-in-blank",
      options: { difficulty: "medium", questionCount: 10 },
      createdAt: new Date("2025-04-20"),
    },
    {
      id: "2",
      userId,
      name: "詳細まとめシート",
      type: "summary",
      options: { sectionCount: 5, includeExamples: true },
      createdAt: new Date("2025-04-15"),
    },
  ]
}
