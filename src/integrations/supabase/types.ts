export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_clans: {
        Row: {
          banner: string
          color: string
          created_at: string
          created_by: string | null
          id: string
          motto: string
          name: string
        }
        Insert: {
          banner?: string
          color?: string
          created_at?: string
          created_by?: string | null
          id: string
          motto?: string
          name: string
        }
        Update: {
          banner?: string
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          motto?: string
          name?: string
        }
        Relationships: []
      }
      app_duels: {
        Row: {
          accepted_by: string[] | null
          bet_canceled_at: number | null
          bet_items: string[] | null
          bet_mode: boolean
          bet_reserved: boolean | null
          bet_reserved_at: number | null
          bet_settled_at: number | null
          bet_type: string | null
          bet_xp_amount: number | null
          category: string
          challenger_id: string
          created_at: number
          id: string
          opponent_ids: string[]
          results: Json
          status: string
          winner_id: string | null
          wod_id: string
          wod_name: string
        }
        Insert: {
          accepted_by?: string[] | null
          bet_canceled_at?: number | null
          bet_items?: string[] | null
          bet_mode?: boolean
          bet_reserved?: boolean | null
          bet_reserved_at?: number | null
          bet_settled_at?: number | null
          bet_type?: string | null
          bet_xp_amount?: number | null
          category?: string
          challenger_id: string
          created_at?: number
          id: string
          opponent_ids?: string[]
          results?: Json
          status?: string
          winner_id?: string | null
          wod_id: string
          wod_name: string
        }
        Update: {
          accepted_by?: string[] | null
          bet_canceled_at?: number | null
          bet_items?: string[] | null
          bet_mode?: boolean
          bet_reserved?: boolean | null
          bet_reserved_at?: number | null
          bet_settled_at?: number | null
          bet_type?: string | null
          bet_xp_amount?: number | null
          category?: string
          challenger_id?: string
          created_at?: number
          id?: string
          opponent_ids?: string[]
          results?: Json
          status?: string
          winner_id?: string | null
          wod_id?: string
          wod_name?: string
        }
        Relationships: []
      }
      app_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          max_uses: number
          status: string
          token: string
          use_count: number
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          max_uses?: number
          status?: string
          token: string
          use_count?: number
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          max_uses?: number
          status?: string
          token?: string
          use_count?: number
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      benchmark_history: {
        Row: {
          exercise_id: string
          id: string
          recorded_at: string
          user_id: string
          value: number
        }
        Insert: {
          exercise_id: string
          id?: string
          recorded_at?: string
          user_id: string
          value: number
        }
        Update: {
          exercise_id?: string
          id?: string
          recorded_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      benchmarks: {
        Row: {
          exercise_id: string
          id: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          exercise_id: string
          id?: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          exercise_id?: string
          id?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_progress: {
        Row: {
          challenge_id: string
          id: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_proofs: {
        Row: {
          challenge_id: string
          id: string
          step: number
          uploaded_at: string
          url: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          step: number
          uploaded_at?: string
          url: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          step?: number
          uploaded_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_proofs_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          end_date: string
          icon: string
          id: string
          name: string
          start_date: string
          target: number
          type: string
          unit: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          end_date: string
          icon?: string
          id: string
          name: string
          start_date: string
          target?: number
          type?: string
          unit?: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          end_date?: string
          icon?: string
          id?: string
          name?: string
          start_date?: string
          target?: number
          type?: string
          unit?: string
          xp_reward?: number
        }
        Relationships: []
      }
      checkins: {
        Row: {
          check_date: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          check_date: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          check_date?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      clan_memberships: {
        Row: {
          clan_id: string
          id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          clan_id: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_memberships_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "app_clans"
            referencedColumns: ["id"]
          },
        ]
      }
      domination_events: {
        Row: {
          battle_id: string
          clan_id: string
          created_at: string
          energy: number
          id: string
          source: string
          user_id: string
        }
        Insert: {
          battle_id: string
          clan_id: string
          created_at?: string
          energy?: number
          id: string
          source?: string
          user_id: string
        }
        Update: {
          battle_id?: string
          clan_id?: string
          created_at?: string
          energy?: number
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "domination_events_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "territory_battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domination_events_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "app_clans"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          content: string
          created_at: number
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: number
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: number
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          content: string
          created_at: number
          id: string
          time_display: string | null
          user_id: string
          wod_name: string | null
        }
        Insert: {
          content: string
          created_at?: number
          id: string
          time_display?: string | null
          user_id: string
          wod_name?: string | null
        }
        Update: {
          content?: string
          created_at?: number
          id?: string
          time_display?: string | null
          user_id?: string
          wod_name?: string | null
        }
        Relationships: []
      }
      feed_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_xp: {
        Row: {
          id: string
          month_key: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          id?: string
          month_key: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          id?: string
          month_key?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: string
          avatar: string | null
          avatar_url: string | null
          battles: number | null
          box_id: string | null
          category: string | null
          checkins: number | null
          created_at: string | null
          email: string
          gender: string | null
          id: string
          level: number | null
          name: string
          streak: number | null
          wins: number | null
          xp: number | null
        }
        Insert: {
          approval_status?: string
          avatar?: string | null
          avatar_url?: string | null
          battles?: number | null
          box_id?: string | null
          category?: string | null
          checkins?: number | null
          created_at?: string | null
          email: string
          gender?: string | null
          id: string
          level?: number | null
          name: string
          streak?: number | null
          wins?: number | null
          xp?: number | null
        }
        Update: {
          approval_status?: string
          avatar?: string | null
          avatar_url?: string | null
          battles?: number | null
          box_id?: string | null
          category?: string | null
          checkins?: number | null
          created_at?: string | null
          email?: string
          gender?: string | null
          id?: string
          level?: number | null
          name?: string
          streak?: number | null
          wins?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      territory_battles: {
        Row: {
          created_at: string
          ends_at: string
          energy_by_clan: Json
          id: string
          period: string
          starts_at: string
          territory_id: string
          winner_clan_id: string | null
        }
        Insert: {
          created_at?: string
          ends_at: string
          energy_by_clan?: Json
          id: string
          period?: string
          starts_at: string
          territory_id: string
          winner_clan_id?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string
          energy_by_clan?: Json
          id?: string
          period?: string
          starts_at?: string
          territory_id?: string
          winner_clan_id?: string | null
        }
        Relationships: []
      }
      training_locations: {
        Row: {
          box_id: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          logo_url: string | null
          longitude: number
          name: string
          radius_meters: number
          tv_layout_model: string | null
          tv_right_top_block_mode: string
          updated_at: string
        }
        Insert: {
          box_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          logo_url?: string | null
          longitude: number
          name: string
          radius_meters?: number
          tv_layout_model?: string | null
          tv_right_top_block_mode?: string
          updated_at?: string
        }
        Update: {
          box_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          logo_url?: string | null
          longitude?: number
          name?: string
          radius_meters?: number
          tv_layout_model?: string | null
          tv_right_top_block_mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          frequency: string | null
          id: string
          level: string | null
          objective: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          frequency?: string | null
          id?: string
          level?: string | null
          objective?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          frequency?: string | null
          id?: string
          level?: string | null
          objective?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wod_results: {
        Row: {
          category: string
          id: string
          result: string
          submitted_at: number
          unit: string
          user_id: string
          wod_id: string
        }
        Insert: {
          category?: string
          id: string
          result: string
          submitted_at?: number
          unit?: string
          user_id: string
          wod_id: string
        }
        Update: {
          category?: string
          id?: string
          result?: string
          submitted_at?: number
          unit?: string
          user_id?: string
          wod_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wod_results_wod_id_fkey"
            columns: ["wod_id"]
            isOneToOne: false
            referencedRelation: "wods"
            referencedColumns: ["id"]
          },
        ]
      }
      wods: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          name: string
          skill: string | null
          type: string
          versions: Json
          warmup: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          id: string
          name: string
          skill?: string | null
          type: string
          versions?: Json
          warmup?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          name?: string
          skill?: string | null
          type?: string
          versions?: Json
          warmup?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_monthly_xp: {
        Args: { _amount: number; _month_key: string; _user_id: string }
        Returns: undefined
      }
      consume_app_invite: { Args: { _token: string }; Returns: string }
      create_app_invite: {
        Args: { _expires_in_hours?: number }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_checkin: {
        Args: { _check_date: string; _user_id: string }
        Returns: boolean
      }
      upsert_benchmark: {
        Args: { _exercise_id: string; _user_id: string; _value: number }
        Returns: undefined
      }
      upsert_wod_result: {
        Args: {
          _category: string
          _id: string
          _result: string
          _unit: string
          _user_id: string
          _wod_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "athlete" | "coach" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["athlete", "coach", "admin"],
    },
  },
} as const
