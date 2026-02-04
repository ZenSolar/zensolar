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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      connected_devices: {
        Row: {
          baseline_data: Json | null
          claimed_at: string
          created_at: string
          device_id: string
          device_metadata: Json | null
          device_name: string | null
          device_type: string
          id: string
          last_minted_at: string | null
          lifetime_totals: Json | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_data?: Json | null
          claimed_at?: string
          created_at?: string
          device_id: string
          device_metadata?: Json | null
          device_name?: string | null
          device_type: string
          id?: string
          last_minted_at?: string | null
          lifetime_totals?: Json | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_data?: Json | null
          claimed_at?: string
          created_at?: string
          device_id?: string
          device_metadata?: Json | null
          device_name?: string | null
          device_type?: string
          id?: string
          last_minted_at?: string | null
          lifetime_totals?: Json | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      energy_production: {
        Row: {
          consumption_wh: number | null
          created_at: string
          device_id: string
          id: string
          production_wh: number
          provider: string
          recorded_at: string
          user_id: string
        }
        Insert: {
          consumption_wh?: number | null
          created_at?: string
          device_id: string
          id?: string
          production_wh?: number
          provider: string
          recorded_at: string
          user_id: string
        }
        Update: {
          consumption_wh?: number | null
          created_at?: string
          device_id?: string
          id?: string
          production_wh?: number
          provider?: string
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      energy_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          extra_data: Json | null
          id: string
          provider: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          extra_data?: Json | null
          id?: string
          provider: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          extra_data?: Json | null
          id?: string
          provider?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mint_transactions: {
        Row: {
          action: string
          block_number: string | null
          created_at: string
          gas_used: string | null
          id: string
          is_beta_mint: boolean
          nft_names: string[] | null
          nfts_minted: number[] | null
          status: string
          tokens_minted: number | null
          tx_hash: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          action: string
          block_number?: string | null
          created_at?: string
          gas_used?: string | null
          id?: string
          is_beta_mint?: boolean
          nft_names?: string[] | null
          nfts_minted?: number[] | null
          status?: string
          tokens_minted?: number | null
          tx_hash: string
          user_id: string
          wallet_address: string
        }
        Update: {
          action?: string
          block_number?: string | null
          created_at?: string
          gas_used?: string | null
          id?: string
          is_beta_mint?: boolean
          nft_names?: string[] | null
          nfts_minted?: number[] | null
          status?: string
          tokens_minted?: number | null
          tx_hash?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          body: string
          data: Json | null
          id: string
          notification_type: string
          sent_at: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          data?: Json | null
          id?: string
          notification_type: string
          sent_at?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          data?: Json | null
          id?: string
          notification_type?: string
          sent_at?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          template_key: string
          title_template: string
          updated_at: string
        }
        Insert: {
          body_template: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          template_key: string
          title_template: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          template_key?: string
          title_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          enphase_connected: boolean | null
          facebook_connected: boolean | null
          facebook_handle: string | null
          hidden_activity_fields: string[] | null
          id: string
          instagram_connected: boolean | null
          instagram_handle: string | null
          is_admin: boolean | null
          linkedin_connected: boolean | null
          linkedin_handle: string | null
          referral_code: string | null
          referred_by: string | null
          solaredge_connected: boolean | null
          tesla_connected: boolean | null
          tiktok_connected: boolean | null
          tiktok_handle: string | null
          twitter_connected: boolean | null
          twitter_handle: string | null
          updated_at: string
          user_id: string
          wallbox_connected: boolean | null
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          enphase_connected?: boolean | null
          facebook_connected?: boolean | null
          facebook_handle?: string | null
          hidden_activity_fields?: string[] | null
          id?: string
          instagram_connected?: boolean | null
          instagram_handle?: string | null
          is_admin?: boolean | null
          linkedin_connected?: boolean | null
          linkedin_handle?: string | null
          referral_code?: string | null
          referred_by?: string | null
          solaredge_connected?: boolean | null
          tesla_connected?: boolean | null
          tiktok_connected?: boolean | null
          tiktok_handle?: string | null
          twitter_connected?: boolean | null
          twitter_handle?: string | null
          updated_at?: string
          user_id: string
          wallbox_connected?: boolean | null
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          enphase_connected?: boolean | null
          facebook_connected?: boolean | null
          facebook_handle?: string | null
          hidden_activity_fields?: string[] | null
          id?: string
          instagram_connected?: boolean | null
          instagram_handle?: string | null
          is_admin?: boolean | null
          linkedin_connected?: boolean | null
          linkedin_handle?: string | null
          referral_code?: string | null
          referred_by?: string | null
          solaredge_connected?: boolean | null
          tesla_connected?: boolean | null
          tiktok_connected?: boolean | null
          tiktok_handle?: string | null
          twitter_connected?: boolean | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string
          wallbox_connected?: boolean | null
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_info: Json | null
          endpoint: string
          id: string
          p256dh: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_info?: Json | null
          endpoint: string
          id?: string
          p256dh: string
          platform?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_info?: Json | null
          endpoint?: string
          id?: string
          p256dh?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          tokens_rewarded: number
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          tokens_rewarded?: number
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          tokens_rewarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      support_requests: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tokenomics_framework_responses: {
        Row: {
          answers: Json
          created_at: string
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
          version: number
          version_name: string | null
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
          version?: number
          version_name?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
          version?: number
          version_name?: string | null
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          calculated_at: string
          claimed: boolean
          claimed_at: string | null
          created_at: string
          energy_wh_basis: number
          id: string
          reward_type: string
          tokens_earned: number
          user_id: string
        }
        Insert: {
          calculated_at?: string
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          energy_wh_basis?: number
          id?: string
          reward_type?: string
          tokens_earned?: number
          user_id: string
        }
        Update: {
          calculated_at?: string
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          energy_wh_basis?: number
          id?: string
          reward_type?: string
          tokens_earned?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      yc_application_content: {
        Row: {
          content: Json
          created_at: string
          display_order: number
          id: string
          section_key: string
          section_title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          display_order?: number
          id?: string
          section_key: string
          section_title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          display_order?: number
          id?: string
          section_key?: string
          section_title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_device_claimed: {
        Args: {
          _current_user_id?: string
          _device_id: string
          _provider: string
        }
        Returns: Json
      }
      lookup_referral_code: { Args: { code: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
