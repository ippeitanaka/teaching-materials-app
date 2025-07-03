export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          file_path: string
          file_type: string
          file_size: number
          extracted_text: string | null
          processing_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          file_path: string
          file_type: string
          file_size: number
          extracted_text?: string | null
          processing_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          file_path?: string
          file_type?: string
          file_size?: number
          extracted_text?: string | null
          processing_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          user_id: string
          document_id: string
          title: string
          description: string | null
          material_type: string
          content: string
          options: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_id: string
          title: string
          description?: string | null
          material_type: string
          content: string
          options?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_id?: string
          title?: string
          description?: string | null
          material_type?: string
          content?: string
          options?: Json
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      shared_materials: {
        Row: {
          id: string
          material_id: string
          shared_by: string
          shared_with: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          material_id: string
          shared_by: string
          shared_with: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          material_id?: string
          shared_by?: string
          shared_with?: string
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          template_type: string
          options: Json
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          template_type: string
          options?: Json
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          template_type?: string
          options?: Json
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
