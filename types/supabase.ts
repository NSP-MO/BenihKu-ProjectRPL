export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: string
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: string
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
      }
      // Add other tables as needed
    }
  }
}
