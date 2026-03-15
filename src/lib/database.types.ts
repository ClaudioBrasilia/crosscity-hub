// Auto-generated types from Supabase
// You can generate these by running: npx supabase gen types typescript --project-id your_project_id > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar: string
          level: number
          xp: number
          streak: number
          checkins: number
          role: 'athlete' | 'coach' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar?: string
          level?: number
          xp?: number
          streak?: number
          checkins?: number
          role?: 'athlete' | 'coach' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar?: string
          level?: number
          xp?: number
          streak?: number
          checkins?: number
          role?: 'athlete' | 'coach' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      duels: {
        Row: {
          id: string
          challenger_id: string
          opponent_id: string
          wod_id: string
          wod_name: string
          category: 'rx' | 'scaled' | 'beginner'
          challenger_result: string | null
          opponent_result: string | null
          status: 'pending' | 'active' | 'finished'
          winner_id: string | null
          bet_mode: boolean
          bet_type: 'xp' | 'equipment' | null
          bet_xp_amount: number | null
          bet_accepted: boolean
          bet_reserved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          challenger_id: string
          opponent_id: string
          wod_id: string
          wod_name: string
          category: 'rx' | 'scaled' | 'beginner'
          challenger_result?: string | null
          opponent_result?: string | null
          status?: 'pending' | 'active' | 'finished'
          winner_id?: string | null
          bet_mode?: boolean
          bet_type?: 'xp' | 'equipment' | null
          bet_xp_amount?: number | null
          bet_accepted?: boolean
          bet_reserved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          challenger_id?: string
          opponent_id?: string
          wod_id?: string
          wod_name?: string
          category?: 'rx' | 'scaled' | 'beginner'
          challenger_result?: string | null
          opponent_result?: string | null
          status?: 'pending' | 'active' | 'finished'
          winner_id?: string | null
          bet_mode?: boolean
          bet_type?: 'xp' | 'equipment' | null
          bet_xp_amount?: number | null
          bet_accepted?: boolean
          bet_reserved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      wods: {
        Row: {
          id: string
          date: string
          name: string
          type: 'For Time' | 'AMRAP' | 'EMOM'
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          name: string
          type: 'For Time' | 'AMRAP' | 'EMOM'
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          name?: string
          type?: 'For Time' | 'AMRAP' | 'EMOM'
          description?: string
          created_at?: string
        }
      }
      clans: {
        Row: {
          id: string
          name: string
          banner: string
          leader_id: string
          xp: number
          members: string[]
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          banner: string
          leader_id: string
          xp?: number
          members?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          banner?: string
          leader_id?: string
          xp?: number
          members?: string[]
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
