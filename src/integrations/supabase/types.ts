export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      automation_logs: {
        Row: {
          context: Json;
          created_at: string;
          event_type: string;
          id: string;
          message: string;
          provider_id: string | null;
          reference_id: string | null;
          source: string;
          status: string;
          user_id: string | null;
        };
        Insert: {
          context?: Json;
          created_at?: string;
          event_type: string;
          id?: string;
          message?: string;
          provider_id?: string | null;
          reference_id?: string | null;
          source?: string;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          context?: Json;
          created_at?: string;
          event_type?: string;
          id?: string;
          message?: string;
          provider_id?: string | null;
          reference_id?: string | null;
          source?: string;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "automation_logs_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "sdk_offerwall_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      faq: {
        Row: {
          answer: string;
          category: string;
          created_at: string;
          id: string;
          question: string;
          sort_order: number;
        };
        Insert: {
          answer: string;
          category?: string;
          created_at?: string;
          id?: string;
          question: string;
          sort_order?: number;
        };
        Update: {
          answer?: string;
          category?: string;
          created_at?: string;
          id?: string;
          question?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          is_read: boolean;
          kind: string;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          kind?: string;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          kind?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      offer_claims: {
        Row: {
          admin_note: string | null;
          created_at: string;
          id: string;
          offer_id: string;
          postback_txn_id: string | null;
          proof_url: string | null;
          reward_amount: number;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          admin_note?: string | null;
          created_at?: string;
          id?: string;
          offer_id: string;
          postback_txn_id?: string | null;
          proof_url?: string | null;
          reward_amount?: number;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          admin_note?: string | null;
          created_at?: string;
          id?: string;
          offer_id?: string;
          postback_txn_id?: string | null;
          proof_url?: string | null;
          reward_amount?: number;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offer_claims_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
        ];
      };
      offer_providers: {
        Row: {
          created_at: string;
          default_revenue_share: number;
          enabled: boolean;
          id: string;
          last_synced_at: string | null;
          name: string;
          provider_type: string;
          slug: string;
          sync_config: Json;
          sync_error: string | null;
          sync_status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_revenue_share?: number;
          enabled?: boolean;
          id?: string;
          last_synced_at?: string | null;
          name: string;
          provider_type?: string;
          slug: string;
          sync_config?: Json;
          sync_error?: string | null;
          sync_status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_revenue_share?: number;
          enabled?: boolean;
          id?: string;
          last_synced_at?: string | null;
          name?: string;
          provider_type?: string;
          slug?: string;
          sync_config?: Json;
          sync_error?: string | null;
          sync_status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      offer_feed_cache: {
        Row: {
          country: string;
          created_at: string;
          expires_at: string;
          id: string;
          last_synced_at: string;
          offer_count: number;
          offers: Json;
          provider_id: string;
          sync_error: string | null;
          updated_at: string;
        };
        Insert: {
          country: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          last_synced_at?: string;
          offer_count?: number;
          offers?: Json;
          provider_id: string;
          sync_error?: string | null;
          updated_at?: string;
        };
        Update: {
          country?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          last_synced_at?: string;
          offer_count?: number;
          offers?: Json;
          provider_id?: string;
          sync_error?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offer_feed_cache_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "offer_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      offer_feed_settings: {
        Row: {
          default_country: string;
          fallback_behavior: string;
          featured_slots: number;
          id: boolean;
          refresh_interval_hours: number;
          updated_at: string;
        };
        Insert: {
          default_country?: string;
          fallback_behavior?: string;
          featured_slots?: number;
          id?: boolean;
          refresh_interval_hours?: number;
          updated_at?: string;
        };
        Update: {
          default_country?: string;
          fallback_behavior?: string;
          featured_slots?: number;
          id?: boolean;
          refresh_interval_hours?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      offers: {
        Row: {
          actual_cost: number | null;
          admin_priority: number;
          category: string | null;
          category_manual: boolean;
          click_url: string | null;
          countries: string[];
          created_at: string;
          deal_group_id: string | null;
          description: string;
          devices: string[];
          expires_at: string | null;
          external_offer_id: string | null;
          icon: string;
          id: string;
          image_url: string | null;
          is_active: boolean;
          is_featured: boolean;
          is_limited_deal: boolean;
          last_seen_at: string | null;
          max_payout_cap: number | null;
          network_payout: number | null;
          not_allowed: string;
          payout_mode: string;
          payout_percentage: number;
          postback_ip_allowlist: string[];
          postback_secret_ref: string | null;
          provider_id: string | null;
          raw_payload: Json | null;
          requirements: string;
          revenue_share: number | null;
          reward_amount: number;
          sort_order: number;
          source: string;
          tags: string[];
          tags_manual: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          actual_cost?: number | null;
          admin_priority?: number;
          category?: string | null;
          category_manual?: boolean;
          click_url?: string | null;
          countries?: string[];
          created_at?: string;
          deal_group_id?: string | null;
          description?: string;
          devices?: string[];
          expires_at?: string | null;
          external_offer_id?: string | null;
          icon?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          is_limited_deal?: boolean;
          last_seen_at?: string | null;
          max_payout_cap?: number | null;
          network_payout?: number | null;
          not_allowed?: string;
          payout_mode?: string;
          payout_percentage?: number;
          postback_ip_allowlist?: string[];
          postback_secret_ref?: string | null;
          provider_id?: string | null;
          raw_payload?: Json | null;
          requirements?: string;
          revenue_share?: number | null;
          reward_amount?: number;
          sort_order?: number;
          source?: string;
          tags?: string[];
          tags_manual?: boolean;
          title: string;
          updated_at?: string;
        };
        Update: {
          actual_cost?: number | null;
          admin_priority?: number;
          category?: string | null;
          category_manual?: boolean;
          click_url?: string | null;
          countries?: string[];
          created_at?: string;
          deal_group_id?: string | null;
          description?: string;
          devices?: string[];
          expires_at?: string | null;
          external_offer_id?: string | null;
          icon?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          is_limited_deal?: boolean;
          last_seen_at?: string | null;
          max_payout_cap?: number | null;
          network_payout?: number | null;
          not_allowed?: string;
          payout_mode?: string;
          payout_percentage?: number;
          postback_ip_allowlist?: string[];
          postback_secret_ref?: string | null;
          provider_id?: string | null;
          raw_payload?: Json | null;
          requirements?: string;
          revenue_share?: number | null;
          reward_amount?: number;
          sort_order?: number;
          source?: string;
          tags?: string[];
          tags_manual?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offers_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "offer_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      payout_methods: {
        Row: {
          account_number: string | null;
          bank_name: string | null;
          country: string | null;
          country_bank_code: string | null;
          created_at: string;
          gift_card_recipient_email: string | null;
          holder_name: string | null;
          id: string;
          ifsc: string | null;
          is_default: boolean;
          label: string;
          method_type: string;
          paypal_email: string | null;
          upi_id: string | null;
          user_id: string;
          wallet_address: string | null;
        };
        Insert: {
          account_number?: string | null;
          bank_name?: string | null;
          country?: string | null;
          country_bank_code?: string | null;
          created_at?: string;
          gift_card_recipient_email?: string | null;
          holder_name?: string | null;
          id?: string;
          ifsc?: string | null;
          is_default?: boolean;
          label?: string;
          method_type?: string;
          paypal_email?: string | null;
          upi_id?: string | null;
          user_id: string;
          wallet_address?: string | null;
        };
        Update: {
          account_number?: string | null;
          bank_name?: string | null;
          country?: string | null;
          country_bank_code?: string | null;
          created_at?: string;
          gift_card_recipient_email?: string | null;
          holder_name?: string | null;
          id?: string;
          ifsc?: string | null;
          is_default?: boolean;
          label?: string;
          method_type?: string;
          paypal_email?: string | null;
          upi_id?: string | null;
          user_id?: string;
          wallet_address?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          date_of_birth: string | null;
          device_id: string | null;
          email: string | null;
          gender: string | null;
          held_balance: number;
          id: string;
          is_flagged: boolean;
          language: string;
          lifetime_earned: number;
          lifetime_withdrawn: number;
          name: string;
          onboarded: boolean;
          phone: string | null;
          push_enabled: boolean;
          referral_code: string;
          referred_by: string | null;
          streak_count: number;
          streak_date: string | null;
          updated_at: string;
          wallet_balance: number;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          device_id?: string | null;
          email?: string | null;
          gender?: string | null;
          held_balance?: number;
          id: string;
          is_flagged?: boolean;
          language?: string;
          lifetime_earned?: number;
          lifetime_withdrawn?: number;
          name?: string;
          onboarded?: boolean;
          phone?: string | null;
          push_enabled?: boolean;
          referral_code: string;
          referred_by?: string | null;
          streak_count?: number;
          streak_date?: string | null;
          updated_at?: string;
          wallet_balance?: number;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          device_id?: string | null;
          email?: string | null;
          gender?: string | null;
          held_balance?: number;
          id?: string;
          is_flagged?: boolean;
          language?: string;
          lifetime_earned?: number;
          lifetime_withdrawn?: number;
          name?: string;
          onboarded?: boolean;
          phone?: string | null;
          push_enabled?: boolean;
          referral_code?: string;
          referred_by?: string | null;
          streak_count?: number;
          streak_date?: string | null;
          updated_at?: string;
          wallet_balance?: number;
        };
        Relationships: [];
      };
      quest_sessions: {
        Row: {
          ads_required: number;
          ads_watched: number;
          credited_at: string | null;
          id: string;
          quest_key: string;
          reward_amount: number;
          started_at: string;
          status: string;
          user_id: string;
          verified_at: string | null;
        };
        Insert: {
          ads_required: number;
          ads_watched?: number;
          credited_at?: string | null;
          id?: string;
          quest_key: string;
          reward_amount: number;
          started_at?: string;
          status?: string;
          user_id: string;
          verified_at?: string | null;
        };
        Update: {
          ads_required?: number;
          ads_watched?: number;
          credited_at?: string | null;
          id?: string;
          quest_key?: string;
          reward_amount?: number;
          started_at?: string;
          status?: string;
          user_id?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          bonus_amount: number;
          code: string;
          created_at: string;
          earning_credited_at: string | null;
          id: string;
          referred_id: string;
          referrer_id: string;
          reward_released_at: string | null;
          signup_credited_at: string | null;
          status: string;
          withdrawal_credited_at: string | null;
        };
        Insert: {
          bonus_amount?: number;
          code: string;
          created_at?: string;
          earning_credited_at?: string | null;
          id?: string;
          referred_id: string;
          referrer_id: string;
          reward_released_at?: string | null;
          signup_credited_at?: string | null;
          status?: string;
          withdrawal_credited_at?: string | null;
        };
        Update: {
          bonus_amount?: number;
          code?: string;
          created_at?: string;
          earning_credited_at?: string | null;
          id?: string;
          referred_id?: string;
          referrer_id?: string;
          reward_released_at?: string | null;
          signup_credited_at?: string | null;
          status?: string;
          withdrawal_credited_at?: string | null;
        };
        Relationships: [];
      };
      sdk_offerwall_conversions: {
        Row: {
          created_at: string;
          currency_amount: number;
          id: string;
          processed_at: string | null;
          provider_id: string;
          provider_offer_id: string | null;
          provider_transaction_id: string;
          provider_user_ref: string | null;
          raw_payload: Json;
          received_at: string;
          reject_reason: string | null;
          reward_amount: number;
          signature_valid: boolean | null;
          source_ip: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
          wallet_transaction_id: string | null;
        };
        Insert: {
          created_at?: string;
          currency_amount?: number;
          id?: string;
          processed_at?: string | null;
          provider_id: string;
          provider_offer_id?: string | null;
          provider_transaction_id: string;
          provider_user_ref?: string | null;
          raw_payload?: Json;
          received_at?: string;
          reject_reason?: string | null;
          reward_amount?: number;
          signature_valid?: boolean | null;
          source_ip?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          wallet_transaction_id?: string | null;
        };
        Update: {
          created_at?: string;
          currency_amount?: number;
          id?: string;
          processed_at?: string | null;
          provider_id?: string;
          provider_offer_id?: string | null;
          provider_transaction_id?: string;
          provider_user_ref?: string | null;
          raw_payload?: Json;
          received_at?: string;
          reject_reason?: string | null;
          reward_amount?: number;
          signature_valid?: boolean | null;
          source_ip?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          wallet_transaction_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sdk_offerwall_conversions_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "sdk_offerwall_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      sdk_offerwall_providers: {
        Row: {
          app_id: string | null;
          created_at: string;
          currency_name: string;
          currency_per_usd: number;
          dedupe_strategy: string;
          dedupe_window_hours: number;
          display_order: number;
          enabled: boolean;
          extra_config: Json;
          id: string;
          integration_type: string;
          logo_url: string | null;
          max_reward: number | null;
          metadata: Json;
          min_reward: number;
          name: string;
          notes: string;
          placement_id: string | null;
          platforms: string[];
          postback_auth_mode: string;
          postback_ip_allowlist: string[];
          postback_path: string | null;
          postback_signature_secret_ref: string | null;
          publisher_id: string | null;
          reward_multiplier: number;
          reward_param: string;
          rounding_mode: string;
          sdk_version: string | null;
          secret_refs: Json;
          slug: string;
          status: string;
          tagline: string;
          transaction_id_param: string;
          updated_at: string;
          user_id_param: string;
          user_identity_mode: string;
          user_identity_salt_ref: string | null;
        };
        Insert: {
          app_id?: string | null;
          created_at?: string;
          currency_name?: string;
          currency_per_usd?: number;
          dedupe_strategy?: string;
          dedupe_window_hours?: number;
          display_order?: number;
          enabled?: boolean;
          extra_config?: Json;
          id?: string;
          integration_type?: string;
          logo_url?: string | null;
          max_reward?: number | null;
          metadata?: Json;
          min_reward?: number;
          name: string;
          notes?: string;
          placement_id?: string | null;
          platforms?: string[];
          postback_auth_mode?: string;
          postback_ip_allowlist?: string[];
          postback_path?: string | null;
          postback_signature_secret_ref?: string | null;
          publisher_id?: string | null;
          reward_multiplier?: number;
          reward_param?: string;
          rounding_mode?: string;
          sdk_version?: string | null;
          secret_refs?: Json;
          slug: string;
          status?: string;
          tagline?: string;
          transaction_id_param?: string;
          updated_at?: string;
          user_id_param?: string;
          user_identity_mode?: string;
          user_identity_salt_ref?: string | null;
        };
        Update: {
          app_id?: string | null;
          created_at?: string;
          currency_name?: string;
          currency_per_usd?: number;
          dedupe_strategy?: string;
          dedupe_window_hours?: number;
          display_order?: number;
          enabled?: boolean;
          extra_config?: Json;
          id?: string;
          integration_type?: string;
          logo_url?: string | null;
          max_reward?: number | null;
          metadata?: Json;
          min_reward?: number;
          name?: string;
          notes?: string;
          placement_id?: string | null;
          platforms?: string[];
          postback_auth_mode?: string;
          postback_ip_allowlist?: string[];
          postback_path?: string | null;
          postback_signature_secret_ref?: string | null;
          publisher_id?: string | null;
          reward_multiplier?: number;
          reward_param?: string;
          rounding_mode?: string;
          sdk_version?: string | null;
          secret_refs?: Json;
          slug?: string;
          status?: string;
          tagline?: string;
          transaction_id_param?: string;
          updated_at?: string;
          user_id_param?: string;
          user_identity_mode?: string;
          user_identity_salt_ref?: string | null;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          admin_response: string | null;
          created_at: string;
          description: string;
          id: string;
          status: string;
          subject: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          admin_response?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          status?: string;
          subject: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          admin_response?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          status?: string;
          subject?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      task_events: {
        Row: {
          created_at: string;
          event_key: string;
          event_type: string;
          id: string;
          metadata: Json;
          occurred_at: string;
          quantity: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_key: string;
          event_type: string;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
          quantity?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_key?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
          quantity?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          created_at: string;
          description: string;
          ends_at: string | null;
          frequency: string;
          icon: string;
          id: string;
          image_url: string | null;
          is_active: boolean;
          is_featured: boolean;
          reward: number;
          sort_order: number;
          starts_at: string | null;
          steps_total: number;
          target: number;
          task_type: string;
          title: string;
          updated_at: string;
          window_days: number | null;
        };
        Insert: {
          created_at?: string;
          description?: string;
          ends_at?: string | null;
          frequency?: string;
          icon?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          reward?: number;
          sort_order?: number;
          starts_at?: string | null;
          steps_total?: number;
          target?: number;
          task_type?: string;
          title: string;
          updated_at?: string;
          window_days?: number | null;
        };
        Update: {
          created_at?: string;
          description?: string;
          ends_at?: string | null;
          frequency?: string;
          icon?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          reward?: number;
          sort_order?: number;
          starts_at?: string | null;
          steps_total?: number;
          target?: number;
          task_type?: string;
          title?: string;
          updated_at?: string;
          window_days?: number | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_tasks: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          period_key: string;
          progress: number;
          reward_status: string;
          rewarded_at: string | null;
          status: string;
          target: number;
          task_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          period_key?: string;
          progress?: number;
          reward_status?: string;
          rewarded_at?: string | null;
          status?: string;
          target?: number;
          task_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          period_key?: string;
          progress?: number;
          reward_status?: string;
          rewarded_at?: string | null;
          status?: string;
          target?: number;
          task_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      wallet_transactions: {
        Row: {
          amount: number;
          created_at: string;
          description: string;
          id: string;
          kind: string;
          reference_id: string | null;
          source: string;
          status: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          description?: string;
          id?: string;
          kind?: string;
          reference_id?: string | null;
          source: string;
          status?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string;
          id?: string;
          kind?: string;
          reference_id?: string | null;
          source?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      withdrawal_requests: {
        Row: {
          admin_note: string | null;
          amount: number;
          created_at: string;
          id: string;
          method_type: string;
          payout_details_snapshot: Json | null;
          payout_method_id: string | null;
          reference_id: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          admin_note?: string | null;
          amount: number;
          created_at?: string;
          id?: string;
          method_type: string;
          payout_details_snapshot?: Json | null;
          payout_method_id?: string | null;
          reference_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          admin_note?: string | null;
          amount?: number;
          created_at?: string;
          id?: string;
          method_type?: string;
          payout_details_snapshot?: Json | null;
          payout_method_id?: string | null;
          reference_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_payout_method_id_fkey";
            columns: ["payout_method_id"];
            isOneToOne: false;
            referencedRelation: "payout_methods";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
