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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          avg_score: number | null
          bot_system_prompt_resolved: string
          completed_at: string | null
          config_label: string | null
          created_at: string | null
          id: string
          lead_prompt_resolved: string
          run_config_id: string
          run_id: string
          scores_by_factor: Json | null
          started_at: string | null
          status: string
          status_message: string | null
          total_cost_usd: number | null
          total_latency_ms: number | null
          total_tokens_in: number | null
          total_tokens_out: number | null
          turn_count: number | null
        }
        Insert: {
          avg_score?: number | null
          bot_system_prompt_resolved: string
          completed_at?: string | null
          config_label?: string | null
          created_at?: string | null
          id?: string
          lead_prompt_resolved: string
          run_config_id: string
          run_id: string
          scores_by_factor?: Json | null
          started_at?: string | null
          status?: string
          status_message?: string | null
          total_cost_usd?: number | null
          total_latency_ms?: number | null
          total_tokens_in?: number | null
          total_tokens_out?: number | null
          turn_count?: number | null
        }
        Update: {
          avg_score?: number | null
          bot_system_prompt_resolved?: string
          completed_at?: string | null
          config_label?: string | null
          created_at?: string | null
          id?: string
          lead_prompt_resolved?: string
          run_config_id?: string
          run_id?: string
          scores_by_factor?: Json | null
          started_at?: string | null
          status?: string
          status_message?: string | null
          total_cost_usd?: number | null
          total_latency_ms?: number | null
          total_tokens_in?: number | null
          total_tokens_out?: number | null
          turn_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_run_config_id_fkey"
            columns: ["run_config_id"]
            isOneToOne: false
            referencedRelation: "run_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_prompts: {
        Row: {
          created_at: string | null
          factors: string[]
          id: string
          is_default: boolean | null
          name: string
          prompt: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          factors: string[]
          id?: string
          is_default?: boolean | null
          name: string
          prompt: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          factors?: string[]
          id?: string
          is_default?: boolean | null
          name?: string
          prompt?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lead_prompts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          prompt: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          prompt: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          prompt?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      llm_calls: {
        Row: {
          cache_hit: boolean | null
          conversation_id: string | null
          cost_usd: number | null
          created_at: string | null
          id: number
          latency_ms: number | null
          model: string
          provider: string
          role: string | null
          tokens_in: number | null
          tokens_out: number | null
          turn_id: number | null
        }
        Insert: {
          cache_hit?: boolean | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          id?: number
          latency_ms?: number | null
          model: string
          provider: string
          role?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          turn_id?: number | null
        }
        Update: {
          cache_hit?: boolean | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          id?: number
          latency_ms?: number | null
          model?: string
          provider?: string
          role?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          turn_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_calls_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_calls_turn_id_fkey"
            columns: ["turn_id"]
            isOneToOne: false
            referencedRelation: "turns"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          attributes: Json | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          overlay_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attributes?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          overlay_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attributes?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          overlay_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string | null
          description: string | null
          end_system_prompt: string
          id: string
          kind: string
          name: string
          sections: Json | null
          system_prompt: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_system_prompt?: string
          id?: string
          kind: string
          name: string
          sections?: Json | null
          system_prompt: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_system_prompt?: string
          id?: string
          kind?: string
          name?: string
          sections?: Json | null
          system_prompt?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      run_configs: {
        Row: {
          created_at: string | null
          factors_enabled: string[]
          id: string
          order_index: number
          pc_section_id: string | null
          persona_id: string | null
          repeat_count: number
          run_id: string
          seed_conversation_id: string | null
          test_case_id: string | null
        }
        Insert: {
          created_at?: string | null
          factors_enabled?: string[]
          id?: string
          order_index: number
          pc_section_id?: string | null
          persona_id?: string | null
          repeat_count?: number
          run_id: string
          seed_conversation_id?: string | null
          test_case_id?: string | null
        }
        Update: {
          created_at?: string | null
          factors_enabled?: string[]
          id?: string
          order_index?: number
          pc_section_id?: string | null
          persona_id?: string | null
          repeat_count?: number
          run_id?: string
          seed_conversation_id?: string | null
          test_case_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "run_configs_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_configs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_configs_seed_conversation_id_fkey"
            columns: ["seed_conversation_id"]
            isOneToOne: false
            referencedRelation: "seed_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_configs_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      runs: {
        Row: {
          bot_prompt_id: string
          completed_at: string | null
          config: Json
          created_at: string | null
          id: string
          judge_prompt_id: string | null
          lead_prompt_id: string
          metrics: Json | null
          name: string | null
          started_at: string | null
          status: string
          status_message: string | null
          user_id: string
        }
        Insert: {
          bot_prompt_id: string
          completed_at?: string | null
          config: Json
          created_at?: string | null
          id?: string
          judge_prompt_id?: string | null
          lead_prompt_id: string
          metrics?: Json | null
          name?: string | null
          started_at?: string | null
          status?: string
          status_message?: string | null
          user_id: string
        }
        Update: {
          bot_prompt_id?: string
          completed_at?: string | null
          config?: Json
          created_at?: string | null
          id?: string
          judge_prompt_id?: string | null
          lead_prompt_id?: string
          metrics?: Json | null
          name?: string | null
          started_at?: string | null
          status?: string
          status_message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runs_bot_prompt_id_fkey"
            columns: ["bot_prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runs_judge_prompt_id_fkey"
            columns: ["judge_prompt_id"]
            isOneToOne: false
            referencedRelation: "judge_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runs_lead_prompt_id_fkey"
            columns: ["lead_prompt_id"]
            isOneToOne: false
            referencedRelation: "lead_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          conversation_id: string
          created_at: string | null
          factor: string
          id: string
          judge_prompt_id: string
          rationale: string | null
          score: number
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          factor: string
          id?: string
          judge_prompt_id: string
          rationale?: string | null
          score: number
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          factor?: string
          id?: string
          judge_prompt_id?: string
          rationale?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "scores_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_judge_prompt_id_fkey"
            columns: ["judge_prompt_id"]
            isOneToOne: false
            referencedRelation: "judge_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_conversations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          source: string | null
          turns: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          source?: string | null
          turns: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          source?: string | null
          turns?: Json
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          anthropic_api_key: string | null
          caching_enabled: boolean | null
          cc_api_base_url: string | null
          cost_tracker_enabled: boolean | null
          default_bot_model: string | null
          default_judge_model: string | null
          default_lead_model: string | null
          google_api_key: string | null
          id: string
          openai_api_key: string | null
          openrouter_api_key: string | null
          token_tracker_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          anthropic_api_key?: string | null
          caching_enabled?: boolean | null
          cc_api_base_url?: string | null
          cost_tracker_enabled?: boolean | null
          default_bot_model?: string | null
          default_judge_model?: string | null
          default_lead_model?: string | null
          google_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          openrouter_api_key?: string | null
          token_tracker_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          anthropic_api_key?: string | null
          caching_enabled?: boolean | null
          cc_api_base_url?: string | null
          cost_tracker_enabled?: boolean | null
          default_bot_model?: string | null
          default_judge_model?: string | null
          default_lead_model?: string | null
          google_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          openrouter_api_key?: string | null
          token_tracker_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      test_cases: {
        Row: {
          created_at: string | null
          expected_behavior: string | null
          id: string
          name: string
          overlay_text: string | null
          scenario: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expected_behavior?: string | null
          id?: string
          name: string
          overlay_text?: string | null
          scenario: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expected_behavior?: string | null
          id?: string
          name?: string
          overlay_text?: string | null
          scenario?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      turns: {
        Row: {
          content: string
          conversation_id: string
          cost_usd: number | null
          created_at: string | null
          id: number
          latency_ms: number | null
          metadata: Json | null
          raw_output: Json | null
          speaker: string
          tokens_in: number | null
          tokens_out: number | null
          turn_index: number
        }
        Insert: {
          content: string
          conversation_id: string
          cost_usd?: number | null
          created_at?: string | null
          id?: number
          latency_ms?: number | null
          metadata?: Json | null
          raw_output?: Json | null
          speaker: string
          tokens_in?: number | null
          tokens_out?: number | null
          turn_index: number
        }
        Update: {
          content?: string
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string | null
          id?: number
          latency_ms?: number | null
          metadata?: Json | null
          raw_output?: Json | null
          speaker?: string
          tokens_in?: number | null
          tokens_out?: number | null
          turn_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "turns_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
