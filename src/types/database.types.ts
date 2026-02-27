export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          is_completed: boolean
          created_at: string
          priority: 'baja' | 'normal' | 'alta'
          due_date: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          is_completed?: boolean
          created_at?: string
          priority?: 'baja' | 'normal' | 'alta'
          due_date?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          is_completed?: boolean
          created_at?: string
          priority?: 'baja' | 'normal' | 'alta'
          due_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}