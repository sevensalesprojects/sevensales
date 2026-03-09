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
      audit_logs: {
        Row: {
          changed_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      automations: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          project_id: string
          trigger_config: Json
          trigger_type: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          project_id: string
          trigger_config?: Json
          trigger_type: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          project_id?: string
          trigger_config?: Json
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          closer_id: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          lead_id: string
          notes: string | null
          scheduled_at: string
          sdr_id: string | null
          status: string
        }
        Insert: {
          closer_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          lead_id: string
          notes?: string | null
          scheduled_at: string
          sdr_id?: string | null
          status?: string
        }
        Update: {
          closer_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          lead_id?: string
          notes?: string | null
          scheduled_at?: string
          sdr_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_records: {
        Row: {
          data_snapshot: Json
          deleted_at: string
          deleted_by: string | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          data_snapshot: Json
          deleted_at?: string
          deleted_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          data_snapshot?: Json
          deleted_at?: string
          deleted_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      followup_flows: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          project_id: string
          trigger_condition: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          project_id: string
          trigger_condition: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          project_id?: string
          trigger_condition?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_flows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_messages: {
        Row: {
          delay_hours: number
          flow_id: string
          id: string
          message_text: string
          order_position: number
        }
        Insert: {
          delay_hours?: number
          flow_id: string
          id?: string
          message_text: string
          order_position?: number
        }
        Update: {
          delay_hours?: number
          flow_id?: string
          id?: string
          message_text?: string
          order_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "followup_messages_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "followup_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_tasks: {
        Row: {
          assigned_sdr: string
          created_at: string
          due_at: string
          flow_id: string
          id: string
          lead_id: string
          message_id: string
          status: string
        }
        Insert: {
          assigned_sdr: string
          created_at?: string
          due_at: string
          flow_id: string
          id?: string
          lead_id: string
          message_id: string
          status?: string
        }
        Update: {
          assigned_sdr?: string
          created_at?: string
          due_at?: string
          flow_id?: string
          id?: string
          lead_id?: string
          message_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_tasks_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "followup_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_tasks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "followup_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_stages: {
        Row: {
          color: string
          funnel_id: string
          id: string
          name: string
          position: number
        }
        Insert: {
          color?: string
          funnel_id: string
          id?: string
          name: string
          position?: number
        }
        Update: {
          color?: string
          funnel_id?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "funnel_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_accounts: {
        Row: {
          access_token: string
          created_at: string
          id: string
          instagram_user_id: string
          page_id: string | null
          project_id: string
          status: string
          token_expires_at: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          instagram_user_id: string
          page_id?: string | null
          project_id: string
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          instagram_user_id?: string
          page_id?: string | null
          project_id?: string
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_accounts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config_json: Json
          created_at: string
          id: string
          project_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          config_json?: Json
          created_at?: string
          id?: string
          project_id: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          config_json?: Json
          created_at?: string
          id?: string
          project_id?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activity_logs: {
        Row: {
          action: string
          created_at: string
          field_changed: string | null
          id: string
          lead_id: string
          new_value: string | null
          old_value: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          field_changed?: string | null
          id?: string
          lead_id: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          field_changed?: string | null
          id?: string
          lead_id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          id?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          call_recording_link: string | null
          channel: string | null
          closer_id: string | null
          consultation_done: boolean | null
          country: string | null
          created_at: string
          email: string | null
          funnel_id: string | null
          google_calendar_event_id: string | null
          group_link: string | null
          group_number: string | null
          id: string
          instagram: string | null
          name: string
          observations: string | null
          phone: string | null
          project_id: string
          qualification_score: string | null
          reference_month: string | null
          response_time_minutes: number | null
          sale_status: string | null
          scheduling_date: string | null
          scheduling_summary: string | null
          sdr_evaluation: string | null
          sdr_id: string | null
          sdr_observations: string | null
          source: string | null
          stage_id: string | null
          updated_at: string
          value_estimate: number | null
        }
        Insert: {
          call_recording_link?: string | null
          channel?: string | null
          closer_id?: string | null
          consultation_done?: boolean | null
          country?: string | null
          created_at?: string
          email?: string | null
          funnel_id?: string | null
          google_calendar_event_id?: string | null
          group_link?: string | null
          group_number?: string | null
          id?: string
          instagram?: string | null
          name: string
          observations?: string | null
          phone?: string | null
          project_id: string
          qualification_score?: string | null
          reference_month?: string | null
          response_time_minutes?: number | null
          sale_status?: string | null
          scheduling_date?: string | null
          scheduling_summary?: string | null
          sdr_evaluation?: string | null
          sdr_id?: string | null
          sdr_observations?: string | null
          source?: string | null
          stage_id?: string | null
          updated_at?: string
          value_estimate?: number | null
        }
        Update: {
          call_recording_link?: string | null
          channel?: string | null
          closer_id?: string | null
          consultation_done?: boolean | null
          country?: string | null
          created_at?: string
          email?: string | null
          funnel_id?: string | null
          google_calendar_event_id?: string | null
          group_link?: string | null
          group_number?: string | null
          id?: string
          instagram?: string | null
          name?: string
          observations?: string | null
          phone?: string | null
          project_id?: string
          qualification_score?: string | null
          reference_month?: string | null
          response_time_minutes?: number | null
          sale_status?: string | null
          scheduling_date?: string | null
          scheduling_summary?: string | null
          sdr_evaluation?: string | null
          sdr_id?: string | null
          sdr_observations?: string | null
          source?: string | null
          stage_id?: string | null
          updated_at?: string
          value_estimate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel: string
          content: string
          created_at: string
          direction: string
          id: string
          instagram_message_id: string | null
          lead_id: string
          media_url: string | null
          project_id: string | null
          sender_id: string | null
        }
        Insert: {
          channel: string
          content: string
          created_at?: string
          direction: string
          id?: string
          instagram_message_id?: string | null
          lead_id: string
          media_url?: string | null
          project_id?: string | null
          sender_id?: string | null
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          direction?: string
          id?: string
          instagram_message_id?: string | null
          lead_id?: string
          media_url?: string | null
          project_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          project_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          project_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          project_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklist: {
        Row: {
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          id: string
          onboarding_id: string
          position: number
          title: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          id?: string
          onboarding_id: string
          position?: number
          title: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          id?: string
          onboarding_id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklist_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "onboarding_process"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          onboarding_id: string
          stage_from: string | null
          stage_to: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          onboarding_id: string
          stage_from?: string | null
          stage_to: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          onboarding_id?: string
          stage_from?: string | null
          stage_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_history_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "onboarding_process"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_process: {
        Row: {
          assigned_user: string | null
          call_link: string | null
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          project_id: string
          purchase_date: string | null
          sale_id: string | null
          scheduled_call_date: string | null
          stage: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_user?: string | null
          call_link?: string | null
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          project_id: string
          purchase_date?: string | null
          sale_id?: string | null
          scheduled_call_date?: string | null
          stage?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_user?: string | null
          call_link?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          project_id?: string
          purchase_date?: string | null
          sale_id?: string | null
          scheduled_call_date?: string | null
          stage?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_process_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_process_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_process_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          currency_code: string
          description: string | null
          id: string
          language: string
          name: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string
          description?: string | null
          id?: string
          language?: string
          name: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          description?: string | null
          id?: string
          language?: string
          name?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount: number
          created_at: string
          external_id: string | null
          id: string
          lead_id: string | null
          product: string
          project_id: string
          source: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_id?: string | null
          id?: string
          lead_id?: string | null
          product: string
          project_id: string
          source?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_id?: string | null
          id?: string
          lead_id?: string | null
          product?: string
          project_id?: string
          source?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string
          color: string | null
          created_at: string
          id: string
          name: string
          project_id: string
        }
        Insert: {
          category?: string
          color?: string | null
          created_at?: string
          id?: string
          name: string
          project_id: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_projects: {
        Row: {
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          integration_id: string
          payload: Json
          processed: boolean
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          integration_id: string
          payload: Json
          processed?: boolean
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          integration_id?: string
          payload?: Json
          processed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sessions: {
        Row: {
          created_at: string
          id: string
          phone_number: string | null
          project_id: string
          session_token: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number?: string | null
          project_id: string
          session_token?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string | null
          project_id?: string
          session_token?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_project_access: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin_master" | "admin" | "gestor" | "sdr" | "closer"
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
      app_role: ["admin_master", "admin", "gestor", "sdr", "closer"],
    },
  },
} as const
