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
      announcement_dismissals: {
        Row: {
          announcement_id: string
          dismissed_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          dismissed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          dismissed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_dismissals_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          data: Json | null
          expires_at: string | null
          id: string
          is_active: boolean
          notification_type: string
          title: string
          url: string | null
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notification_type?: string
          title: string
          url?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notification_type?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      beta_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      bidirectional_mint_events: {
        Row: {
          created_at: string
          device_id: string
          direction: string
          ended_at: string | null
          energy_kwh: number
          event_fingerprint: string | null
          flow_type: string
          genesis_reason: string | null
          genesis_status: Database["public"]["Enums"]["genesis_status"]
          id: string
          mint_status: string
          mint_tx_hash: string | null
          origin_proof: Json | null
          patent_claim_ref: string | null
          proof_hash: string | null
          proof_metadata: Json | null
          provider: string
          recorded_at: string
          session_id: string
          started_at: string | null
          tokens_minted: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          direction: string
          ended_at?: string | null
          energy_kwh?: number
          event_fingerprint?: string | null
          flow_type: string
          genesis_reason?: string | null
          genesis_status?: Database["public"]["Enums"]["genesis_status"]
          id?: string
          mint_status?: string
          mint_tx_hash?: string | null
          origin_proof?: Json | null
          patent_claim_ref?: string | null
          proof_hash?: string | null
          proof_metadata?: Json | null
          provider: string
          recorded_at?: string
          session_id: string
          started_at?: string | null
          tokens_minted?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          direction?: string
          ended_at?: string | null
          energy_kwh?: number
          event_fingerprint?: string | null
          flow_type?: string
          genesis_reason?: string | null
          genesis_status?: Database["public"]["Enums"]["genesis_status"]
          id?: string
          mint_status?: string
          mint_tx_hash?: string | null
          origin_proof?: Json | null
          patent_claim_ref?: string | null
          proof_hash?: string | null
          proof_metadata?: Json | null
          provider?: string
          recorded_at?: string
          session_id?: string
          started_at?: string | null
          tokens_minted?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      charging_sessions: {
        Row: {
          charging_type: string
          created_at: string
          device_id: string
          energy_kwh: number
          event_fingerprint: string | null
          fee_amount: number | null
          fee_currency: string | null
          genesis_reason: string | null
          genesis_status: Database["public"]["Enums"]["genesis_status"]
          id: string
          location: string | null
          origin_proof: Json | null
          provider: string
          session_date: string
          session_metadata: Json | null
          user_id: string
        }
        Insert: {
          charging_type?: string
          created_at?: string
          device_id: string
          energy_kwh?: number
          event_fingerprint?: string | null
          fee_amount?: number | null
          fee_currency?: string | null
          genesis_reason?: string | null
          genesis_status?: Database["public"]["Enums"]["genesis_status"]
          id?: string
          location?: string | null
          origin_proof?: Json | null
          provider: string
          session_date: string
          session_metadata?: Json | null
          user_id: string
        }
        Update: {
          charging_type?: string
          created_at?: string
          device_id?: string
          energy_kwh?: number
          event_fingerprint?: string | null
          fee_amount?: number | null
          fee_currency?: string | null
          genesis_reason?: string | null
          genesis_status?: Database["public"]["Enums"]["genesis_status"]
          id?: string
          location?: string | null
          origin_proof?: Json | null
          provider?: string
          session_date?: string
          session_metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      collusion_signals: {
        Row: {
          detected_at: string
          evidence: Json
          fingerprint: string
          id: string
          severity: string
          signal_key: string
          user_ids: string[]
        }
        Insert: {
          detected_at?: string
          evidence?: Json
          fingerprint: string
          id?: string
          severity?: string
          signal_key: string
          user_ids: string[]
        }
        Update: {
          detected_at?: string
          evidence?: Json
          fingerprint?: string
          id?: string
          severity?: string
          signal_key?: string
          user_ids?: string[]
        }
        Relationships: []
      }
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
      deason_inner_circle: {
        Row: {
          granted_at: string
          granted_by: string | null
          note: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          note?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deason_usage: {
        Row: {
          message_count: number
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          message_count?: number
          updated_at?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          message_count?: number
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_access_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          uses?: number
        }
        Relationships: []
      }
      demo_access_log: {
        Row: {
          access_code: string
          accessed_at: string
          city: string | null
          country: string | null
          created_at: string
          id: string
          ip_address: string | null
          nda_signature_id: string | null
          nda_signed: boolean
          region: string | null
          user_agent: string | null
        }
        Insert: {
          access_code: string
          accessed_at?: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          nda_signature_id?: string | null
          nda_signed?: boolean
          region?: string | null
          user_agent?: string | null
        }
        Update: {
          access_code?: string
          accessed_at?: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          nda_signature_id?: string | null
          nda_signed?: boolean
          region?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_access_log_nda_signature_id_fkey"
            columns: ["nda_signature_id"]
            isOneToOne: false
            referencedRelation: "nda_signatures"
            referencedColumns: ["id"]
          },
        ]
      }
      device_handoff_log: {
        Row: {
          device_id: string
          handoff_at: string
          id: string
          new_user_id: string
          previous_lifetime_totals: Json | null
          previous_user_id: string
          provider: string
        }
        Insert: {
          device_id: string
          handoff_at?: string
          id?: string
          new_user_id: string
          previous_lifetime_totals?: Json | null
          previous_user_id: string
          provider: string
        }
        Update: {
          device_id?: string
          handoff_at?: string
          id?: string
          new_user_id?: string
          previous_lifetime_totals?: Json | null
          previous_user_id?: string
          provider?: string
        }
        Relationships: []
      }
      email_link_clicks: {
        Row: {
          clicked_at: string
          destination_url: string | null
          id: string
          ip_address: string | null
          link_key: string
          message_id: string
          recipient_email: string | null
          template_name: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          destination_url?: string | null
          id?: string
          ip_address?: string | null
          link_key: string
          message_id: string
          recipient_email?: string | null
          template_name?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          destination_url?: string | null
          id?: string
          ip_address?: string | null
          link_key?: string
          message_id?: string
          recipient_email?: string | null
          template_name?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_opens: {
        Row: {
          id: string
          ip_address: string | null
          message_id: string
          metadata: Json | null
          opened_at: string
          recipient_email: string | null
          template_name: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          message_id: string
          metadata?: Json | null
          opened_at?: string
          recipient_email?: string | null
          template_name?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          message_id?: string
          metadata?: Json | null
          opened_at?: string
          recipient_email?: string | null
          template_name?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      energy_manual_adjustments: {
        Row: {
          admin_user_id: string
          beta_only: boolean
          created_at: string
          id: string
          kwh_adjustment: number
          reason: string
          source_row_id: string | null
          source_table: string
          target_user_id: string
        }
        Insert: {
          admin_user_id: string
          beta_only?: boolean
          created_at?: string
          id?: string
          kwh_adjustment: number
          reason: string
          source_row_id?: string | null
          source_table: string
          target_user_id: string
        }
        Update: {
          admin_user_id?: string
          beta_only?: boolean
          created_at?: string
          id?: string
          kwh_adjustment?: number
          reason?: string
          source_row_id?: string | null
          source_table?: string
          target_user_id?: string
        }
        Relationships: []
      }
      energy_production: {
        Row: {
          consumption_wh: number | null
          created_at: string
          data_type: string
          device_id: string
          event_fingerprint: string | null
          genesis_reason: string | null
          genesis_status: Database["public"]["Enums"]["genesis_status"]
          id: string
          origin_proof: Json | null
          production_wh: number
          proof_metadata: Json | null
          provider: string
          recorded_at: string
          user_id: string
        }
        Insert: {
          consumption_wh?: number | null
          created_at?: string
          data_type?: string
          device_id: string
          event_fingerprint?: string | null
          genesis_reason?: string | null
          genesis_status?: Database["public"]["Enums"]["genesis_status"]
          id?: string
          origin_proof?: Json | null
          production_wh?: number
          proof_metadata?: Json | null
          provider: string
          recorded_at: string
          user_id: string
        }
        Update: {
          consumption_wh?: number | null
          created_at?: string
          data_type?: string
          device_id?: string
          event_fingerprint?: string | null
          genesis_reason?: string | null
          genesis_status?: Database["public"]["Enums"]["genesis_status"]
          id?: string
          origin_proof?: Json | null
          production_wh?: number
          proof_metadata?: Json | null
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
      founder_dashboard_prefs: {
        Row: {
          show_manual_adjustments_in_kpi: boolean
          show_unverifiable_in_kpi: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          show_manual_adjustments_in_kpi?: boolean
          show_unverifiable_in_kpi?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          show_manual_adjustments_in_kpi?: boolean
          show_unverifiable_in_kpi?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      founder_decision_votes: {
        Row: {
          choice: string | null
          comment: string | null
          created_at: string
          decision_id: string
          id: string
          updated_at: string
          user_id: string
          vote: string
        }
        Insert: {
          choice?: string | null
          comment?: string | null
          created_at?: string
          decision_id: string
          id?: string
          updated_at?: string
          user_id: string
          vote: string
        }
        Update: {
          choice?: string | null
          comment?: string | null
          created_at?: string
          decision_id?: string
          id?: string
          updated_at?: string
          user_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_decision_votes_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "founder_decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_decisions: {
        Row: {
          context: string
          created_at: string
          id: string
          locked_at: string | null
          locked_choice: string | null
          options: Json
          proposed_by: string | null
          recommendation: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          context: string
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_choice?: string | null
          options?: Json
          proposed_by?: string | null
          recommendation?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          context?: string
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_choice?: string | null
          options?: Json
          proposed_by?: string | null
          recommendation?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      founder_pins: {
        Row: {
          created_at: string
          failed_attempts: number
          locked_until: string | null
          pin_hash: string
          salt: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number
          locked_until?: string | null
          pin_hash: string
          salt: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number
          locked_until?: string | null
          pin_hash?: string
          salt?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      founder_vault_access: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          is_active: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id?: string
          is_active?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          is_active?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      home_charging_sessions: {
        Row: {
          charger_power_kw: number | null
          created_at: string
          delta_proof: string | null
          device_id: string
          end_kwh_added: number
          end_time: string | null
          event_fingerprint: string | null
          genesis_reason: string | null
          genesis_status: Database["public"]["Enums"]["genesis_status"]
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          origin_proof: Json | null
          proof_chain: Json | null
          session_metadata: Json | null
          start_kwh_added: number
          start_time: string
          status: string
          total_session_kwh: number
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          charger_power_kw?: number | null
          created_at?: string
          delta_proof?: string | null
          device_id: string
          end_kwh_added?: number
          end_time?: string | null
          event_fingerprint?: string | null
          genesis_reason?: string | null
          genesis_status?: Database["public"]["Enums"]["genesis_status"]
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          origin_proof?: Json | null
          proof_chain?: Json | null
          session_metadata?: Json | null
          start_kwh_added?: number
          start_time?: string
          status?: string
          total_session_kwh?: number
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          charger_power_kw?: number | null
          created_at?: string
          delta_proof?: string | null
          device_id?: string
          end_kwh_added?: number
          end_time?: string | null
          event_fingerprint?: string | null
          genesis_reason?: string | null
          genesis_status?: Database["public"]["Enums"]["genesis_status"]
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          origin_proof?: Json | null
          proof_chain?: Json | null
          session_metadata?: Json | null
          start_kwh_added?: number
          start_time?: string
          status?: string
          total_session_kwh?: number
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      kpi_reconciliation_log: {
        Row: {
          computed_value: number
          details: Json
          detected_at: string
          diff: number
          diff_pct: number
          headline_value: number
          id: string
          kpi_key: string
          passed: boolean
          scope: string
          severity: string
          source_breakdown: Json
          tolerance_pct: number
          user_id: string | null
        }
        Insert: {
          computed_value: number
          details?: Json
          detected_at?: string
          diff: number
          diff_pct: number
          headline_value: number
          id?: string
          kpi_key: string
          passed?: boolean
          scope?: string
          severity?: string
          source_breakdown?: Json
          tolerance_pct?: number
          user_id?: string | null
        }
        Update: {
          computed_value?: number
          details?: Json
          detected_at?: string
          diff?: number
          diff_pct?: number
          headline_value?: number
          id?: string
          kpi_key?: string
          passed?: boolean
          scope?: string
          severity?: string
          source_breakdown?: Json
          tolerance_pct?: number
          user_id?: string | null
        }
        Relationships: []
      }
      kpi_tap_events: {
        Row: {
          category: string
          event_type: string
          id: string
          metadata: Json | null
          occurred_at: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          category: string
          event_type: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          category?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lp_rounds: {
        Row: {
          created_at: string
          created_by: string | null
          executed_at: string
          id: string
          notes: string | null
          round_number: number
          spot_price_usd: number
          tokens_released: number
          usdc_injected: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          executed_at?: string
          id?: string
          notes?: string | null
          round_number: number
          spot_price_usd: number
          tokens_released: number
          usdc_injected: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          executed_at?: string
          id?: string
          notes?: string | null
          round_number?: number
          spot_price_usd?: number
          tokens_released?: number
          usdc_injected?: number
        }
        Relationships: []
      }
      mint_access_requests: {
        Row: {
          access_code: string | null
          created_at: string
          id: string
          ip_address: string | null
          notified: boolean
          requester_email: string | null
          requester_name: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          source: string
          user_agent: string | null
        }
        Insert: {
          access_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          notified?: boolean
          requester_email?: string | null
          requester_name?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string
          user_agent?: string | null
        }
        Update: {
          access_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          notified?: boolean
          requester_email?: string | null
          requester_name?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      mint_idempotency_keys: {
        Row: {
          action: string
          created_at: string
          id: string
          mint_tx_hash: string | null
          user_id: string
          window_end: string
          window_start: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          mint_tx_hash?: string | null
          user_id: string
          window_end: string
          window_start: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          mint_tx_hash?: string | null
          user_id?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      mint_reconciliation_log: {
        Row: {
          category: string
          created_at: string
          diff_pct: number
          headline_amount: number
          id: string
          mint_tx_hash: string
          on_chain_amount: number
          passed: boolean
          rows_amount: number
          source_breakdown: Json
          tolerance_pct: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          diff_pct: number
          headline_amount: number
          id?: string
          mint_tx_hash: string
          on_chain_amount: number
          passed: boolean
          rows_amount: number
          source_breakdown?: Json
          tolerance_pct?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          diff_pct?: number
          headline_amount?: number
          id?: string
          mint_tx_hash?: string
          on_chain_amount?: number
          passed?: boolean
          rows_amount?: number
          source_breakdown?: Json
          tolerance_pct?: number
          user_id?: string
        }
        Relationships: []
      }
      mint_transactions: {
        Row: {
          action: string
          block_number: string | null
          chain_hash: string | null
          chain_prev_hash: string | null
          chain_seq: number | null
          created_at: string
          gas_used: string | null
          id: string
          is_beta_mint: boolean
          kwh_delta: number | null
          miles_delta: number | null
          nft_names: string[] | null
          nfts_minted: number[] | null
          reconciliation_diff: number | null
          source_breakdown: Json | null
          status: string
          tokens_minted: number | null
          tx_hash: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          action: string
          block_number?: string | null
          chain_hash?: string | null
          chain_prev_hash?: string | null
          chain_seq?: number | null
          created_at?: string
          gas_used?: string | null
          id?: string
          is_beta_mint?: boolean
          kwh_delta?: number | null
          miles_delta?: number | null
          nft_names?: string[] | null
          nfts_minted?: number[] | null
          reconciliation_diff?: number | null
          source_breakdown?: Json | null
          status?: string
          tokens_minted?: number | null
          tx_hash: string
          user_id: string
          wallet_address: string
        }
        Update: {
          action?: string
          block_number?: string | null
          chain_hash?: string | null
          chain_prev_hash?: string | null
          chain_seq?: number | null
          created_at?: string
          gas_used?: string | null
          id?: string
          is_beta_mint?: boolean
          kwh_delta?: number | null
          miles_delta?: number | null
          nft_names?: string[] | null
          nfts_minted?: number[] | null
          reconciliation_diff?: number | null
          source_breakdown?: Json | null
          status?: string
          tokens_minted?: number | null
          tx_hash?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      nda_signatures: {
        Row: {
          access_code_used: string | null
          created_at: string
          email: string
          email_sent: boolean
          full_name: string
          id: string
          ip_address: string | null
          nda_version: string
          signature_method: string
          signature_text: string
          signed_at: string
          user_agent: string | null
        }
        Insert: {
          access_code_used?: string | null
          created_at?: string
          email: string
          email_sent?: boolean
          full_name: string
          id?: string
          ip_address?: string | null
          nda_version?: string
          signature_method?: string
          signature_text: string
          signed_at?: string
          user_agent?: string | null
        }
        Update: {
          access_code_used?: string | null
          created_at?: string
          email?: string
          email_sent?: boolean
          full_name?: string
          id?: string
          ip_address?: string | null
          nda_version?: string
          signature_method?: string
          signature_text?: string
          signed_at?: string
          user_agent?: string | null
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
      origin_proof_keys: {
        Row: {
          algorithm: string
          created_at: string
          description: string | null
          id: string
          key_id: string
          provider: string
          revoked_at: string | null
          secret_hash: string
        }
        Insert: {
          algorithm?: string
          created_at?: string
          description?: string | null
          id?: string
          key_id: string
          provider: string
          revoked_at?: string | null
          secret_hash: string
        }
        Update: {
          algorithm?: string
          created_at?: string
          description?: string | null
          id?: string
          key_id?: string
          provider?: string
          revoked_at?: string | null
          secret_hash?: string
        }
        Relationships: []
      }
      origin_proof_verifications: {
        Row: {
          action: string
          details: Json
          id: string
          key_id: string | null
          payload_hash: string | null
          provider: string
          result: string
          user_id: string | null
          verified_at: string
        }
        Insert: {
          action: string
          details?: Json
          id?: string
          key_id?: string | null
          payload_hash?: string | null
          provider: string
          result: string
          user_id?: string | null
          verified_at?: string
        }
        Update: {
          action?: string
          details?: Json
          id?: string
          key_id?: string | null
          payload_hash?: string | null
          provider?: string
          result?: string
          user_id?: string | null
          verified_at?: string
        }
        Relationships: []
      }
      pending_push_messages: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          data: Json
          delivered_at: string | null
          id: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          data?: Json
          delivered_at?: string | null
          id?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          delivered_at?: string | null
          id?: string
          status?: string
          title?: string
          user_id?: string
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
          home_address: string | null
          id: string
          instagram_connected: boolean | null
          instagram_handle: string | null
          last_login_at: string | null
          last_seen_at: string | null
          linkedin_connected: boolean | null
          linkedin_handle: string | null
          login_count: number
          referral_code: string | null
          referred_by: string | null
          solaredge_connected: boolean | null
          tesla_connected: boolean | null
          tiktok_connected: boolean | null
          tiktok_handle: string | null
          timezone: string | null
          twitter_connected: boolean | null
          twitter_handle: string | null
          ui_density: string
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
          home_address?: string | null
          id?: string
          instagram_connected?: boolean | null
          instagram_handle?: string | null
          last_login_at?: string | null
          last_seen_at?: string | null
          linkedin_connected?: boolean | null
          linkedin_handle?: string | null
          login_count?: number
          referral_code?: string | null
          referred_by?: string | null
          solaredge_connected?: boolean | null
          tesla_connected?: boolean | null
          tiktok_connected?: boolean | null
          tiktok_handle?: string | null
          timezone?: string | null
          twitter_connected?: boolean | null
          twitter_handle?: string | null
          ui_density?: string
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
          home_address?: string | null
          id?: string
          instagram_connected?: boolean | null
          instagram_handle?: string | null
          last_login_at?: string | null
          last_seen_at?: string | null
          linkedin_connected?: boolean | null
          linkedin_handle?: string | null
          login_count?: number
          referral_code?: string | null
          referred_by?: string | null
          solaredge_connected?: boolean | null
          tesla_connected?: boolean | null
          tiktok_connected?: boolean | null
          tiktok_handle?: string | null
          timezone?: string | null
          twitter_connected?: boolean | null
          twitter_handle?: string | null
          ui_density?: string
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
      proof_of_permanence_anchors: {
        Row: {
          block_number: string | null
          created_at: string
          details: Json
          id: string
          leaf_count: number
          max_chain_seq_global: number
          merkle_root: string
          onchain_tx_hash: string | null
          snapshot_at: string
        }
        Insert: {
          block_number?: string | null
          created_at?: string
          details?: Json
          id?: string
          leaf_count: number
          max_chain_seq_global: number
          merkle_root: string
          onchain_tx_hash?: string | null
          snapshot_at?: string
        }
        Update: {
          block_number?: string | null
          created_at?: string
          details?: Json
          id?: string
          leaf_count?: number
          max_chain_seq_global?: number
          merkle_root?: string
          onchain_tx_hash?: string | null
          snapshot_at?: string
        }
        Relationships: []
      }
      protocol_settings: {
        Row: {
          beta_overrides_enabled: boolean
          id: number
          mainnet_launched_at: string | null
          notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          beta_overrides_enabled?: boolean
          id?: number
          mainnet_launched_at?: string | null
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          beta_overrides_enabled?: boolean
          id?: number
          mainnet_launched_at?: string | null
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
      seo_tasks: {
        Row: {
          created_at: string
          id: string
          status: string
          task_key: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          task_key: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          task_key?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tokenomics_archive: {
        Row: {
          allocations: Json
          archived_at: string
          archived_by: string | null
          created_at: string
          id: string
          lp_seed: Json
          max_supply: number
          mint_distribution: Json
          model_name: string
          model_version: string
          notes: string | null
          prices: Json
          reason: string
          reward_rates: Json
          superseded_by: string | null
          transfer_tax: Json
        }
        Insert: {
          allocations: Json
          archived_at?: string
          archived_by?: string | null
          created_at?: string
          id?: string
          lp_seed: Json
          max_supply: number
          mint_distribution: Json
          model_name: string
          model_version: string
          notes?: string | null
          prices: Json
          reason: string
          reward_rates: Json
          superseded_by?: string | null
          transfer_tax: Json
        }
        Update: {
          allocations?: Json
          archived_at?: string
          archived_by?: string | null
          created_at?: string
          id?: string
          lp_seed?: Json
          max_supply?: number
          mint_distribution?: Json
          model_name?: string
          model_version?: string
          notes?: string | null
          prices?: Json
          reason?: string
          reward_rates?: Json
          superseded_by?: string | null
          transfer_tax?: Json
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
      tokenomics_models: {
        Row: {
          allocations: Json
          created_at: string
          id: string
          is_active: boolean
          lp_seed: Json
          max_supply: number
          mint_distribution: Json
          model_name: string
          notes: string | null
          prices: Json
          reward_rates: Json
          subscription: Json
          transfer_tax: Json
          updated_at: string
          version: number
        }
        Insert: {
          allocations?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          lp_seed?: Json
          max_supply: number
          mint_distribution?: Json
          model_name: string
          notes?: string | null
          prices?: Json
          reward_rates?: Json
          subscription?: Json
          transfer_tax?: Json
          updated_at?: string
          version: number
        }
        Update: {
          allocations?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          lp_seed?: Json
          max_supply?: number
          mint_distribution?: Json
          model_name?: string
          notes?: string | null
          prices?: Json
          reward_rates?: Json
          subscription?: Json
          transfer_tax?: Json
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      user_invariant_violations: {
        Row: {
          actual: number | null
          check_name: string
          details: Json
          detected_at: string
          diff_pct: number | null
          expected: number | null
          id: string
          severity: string
          user_id: string
        }
        Insert: {
          actual?: number | null
          check_name: string
          details?: Json
          detected_at?: string
          diff_pct?: number | null
          expected?: number | null
          id?: string
          severity?: string
          user_id: string
        }
        Update: {
          actual?: number | null
          check_name?: string
          details?: Json
          detected_at?: string
          diff_pct?: number | null
          expected?: number | null
          id?: string
          severity?: string
          user_id?: string
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
      user_view_presets: {
        Row: {
          created_at: string
          filters: Json
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
          view_key: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
          view_key: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          view_key?: string
        }
        Relationships: []
      }
      vault_access_log: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vault_state: {
        Row: {
          current_price_usd: number
          family_legacy_pact_active: boolean
          id: number
          joseph_allocation: number
          joseph_trillionaire_price: number
          michael_allocation: number
          michael_trillionaire_price: number
          pact_start_date: string
          total_supply: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          current_price_usd?: number
          family_legacy_pact_active?: boolean
          id?: number
          joseph_allocation?: number
          joseph_trillionaire_price?: number
          michael_allocation?: number
          michael_trillionaire_price?: number
          pact_start_date?: string
          total_supply?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          current_price_usd?: number
          family_legacy_pact_active?: boolean
          id?: number
          joseph_allocation?: number
          joseph_trillionaire_price?: number
          michael_allocation?: number
          michael_trillionaire_price?: number
          pact_start_date?: string
          total_supply?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      vault_webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_label: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      vip_code_notifications: {
        Row: {
          access_code: string
          first_used_at: string
          id: string
          notified_at: string
          signer_email: string | null
          signer_name: string | null
        }
        Insert: {
          access_code: string
          first_used_at?: string
          id?: string
          notified_at?: string
          signer_email?: string | null
          signer_name?: string | null
        }
        Update: {
          access_code?: string
          first_used_at?: string
          id?: string
          notified_at?: string
          signer_email?: string | null
          signer_name?: string | null
        }
        Relationships: []
      }
      work_journal: {
        Row: {
          category: string
          created_at: string
          created_by: string
          date: string
          description: string
          id: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          date?: string
          description: string
          id?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      work_journal_snapshots_schema: {
        Row: {
          columns_snapshot: Json
          created_at: string | null
          functions_snapshot: Json
          id: string
          policies_snapshot: Json
          snapshot_date: string
          tables_snapshot: Json
        }
        Insert: {
          columns_snapshot?: Json
          created_at?: string | null
          functions_snapshot?: Json
          id?: string
          policies_snapshot?: Json
          snapshot_date: string
          tables_snapshot?: Json
        }
        Update: {
          columns_snapshot?: Json
          created_at?: string | null
          functions_snapshot?: Json
          id?: string
          policies_snapshot?: Json
          snapshot_date?: string
          tables_snapshot?: Json
        }
        Relationships: []
      }
      work_journal_summaries: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: string
          summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          id?: string
          summary: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          summary?: string
          updated_at?: string
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
      check_anchor_freshness: { Args: never; Returns: number }
      check_nda_signed: { Args: { _email: string }; Returns: boolean }
      compute_mint_chain_hash: {
        Args: {
          _action: string
          _created_at: string
          _kwh: number
          _miles: number
          _prev: string
          _tokens: number
          _tx_hash: string
          _user_id: string
        }
        Returns: string
      }
      compute_permanence_snapshot: { Args: never; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      detect_collusion_signals: { Args: never; Returns: number }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_admin_live_snapshot: { Args: never; Returns: Json }
      get_connected_providers: {
        Args: { _user_id: string }
        Returns: {
          provider: string
        }[]
      }
      get_covering_anchor: { Args: { _chain_hash: string }; Returns: Json }
      get_live_earnings_stats: { Args: never; Returns: Json }
      get_merkle_inclusion_proof: {
        Args: { _chain_hash: string }
        Returns: Json
      }
      get_mint_receipt: { Args: { _chain_hash: string }; Returns: Json }
      get_mintable_status_filter: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["genesis_status"][]
      }
      get_nda_signer_name: { Args: { _email: string }; Returns: string }
      get_profiles_for_viewer: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          enphase_connected: boolean
          last_seen_at: string
          login_count: number
          referral_code: string
          solaredge_connected: boolean
          tesla_connected: boolean
          user_id: string
          wallbox_connected: boolean
        }[]
      }
      get_schema_snapshot: { Args: never; Returns: Json }
      get_viewer_target_admin: { Args: never; Returns: string }
      has_dashboard_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_deason_usage: { Args: { _user_id: string }; Returns: number }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_or_editor: { Args: { _user_id: string }; Returns: boolean }
      is_deason_inner_circle: { Args: { _user_id: string }; Returns: boolean }
      is_device_claimed: {
        Args: {
          _current_user_id?: string
          _device_id: string
          _provider: string
        }
        Returns: Json
      }
      is_founder: { Args: { _user_id: string }; Returns: boolean }
      is_viewer: { Args: { _user_id: string }; Returns: boolean }
      lookup_referral_code: { Args: { code: string }; Returns: string }
      merkle_root_text: { Args: { _leaves: string[] }; Returns: string }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      verify_chain_integrity: { Args: never; Returns: number }
      verify_demo_code: { Args: { _code: string }; Returns: boolean }
      verify_kpi_reconciliation: { Args: never; Returns: number }
      verify_user_sum_invariant: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user" | "editor" | "viewer" | "founder"
      genesis_status:
        | "pending_genesis"
        | "genesis_consumed"
        | "unverifiable_source"
        | "broken"
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
      app_role: ["admin", "user", "editor", "viewer", "founder"],
      genesis_status: [
        "pending_genesis",
        "genesis_consumed",
        "unverifiable_source",
        "broken",
      ],
    },
  },
} as const
