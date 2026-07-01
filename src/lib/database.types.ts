export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          gender: string | null
          id: string
          music_app: string | null
          mute_drop_pings: boolean
          name: string | null
          services: string[]
          timezone: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          gender?: string | null
          id: string
          music_app?: string | null
          mute_drop_pings?: boolean
          name?: string | null
          services?: string[]
          timezone?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          gender?: string | null
          id?: string
          music_app?: string | null
          mute_drop_pings?: boolean
          name?: string | null
          services?: string[]
          timezone?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          color: string
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          id?: string
          invite_code?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          is_home: boolean
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          is_home?: boolean
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          is_home?: boolean
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          anon: boolean
          created_at: string
          created_by: string
          data: Json
          group_id: string
          id: string
          note: string | null
          private: boolean
          rating_style: string | null
          rating_value: string | null
          targeted: boolean
          type: string
        }
        Insert: {
          anon?: boolean
          created_at?: string
          created_by: string
          data?: Json
          group_id: string
          id?: string
          note?: string | null
          private?: boolean
          rating_style?: string | null
          rating_value?: string | null
          targeted?: boolean
          type: string
        }
        Update: {
          anon?: boolean
          created_at?: string
          created_by?: string
          data?: Json
          group_id?: string
          id?: string
          note?: string | null
          private?: boolean
          rating_style?: string | null
          rating_value?: string | null
          targeted?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          emoji: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      curate_people: {
        Row: {
          consent: boolean
          created_at: string
          id: string
          name: string
          photo_url: string | null
          where_met: string | null
        }
        Insert: {
          consent?: boolean
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          where_met?: string | null
        }
        Update: {
          consent?: boolean
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          where_met?: string | null
        }
        Relationships: []
      }
      curate_drops: {
        Row: {
          created_at: string
          data: Json
          id: string
          moment: string
          person_id: string
          published: boolean
          their_words: string | null
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          moment: string
          person_id: string
          published?: boolean
          their_words?: string | null
          type: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          moment?: string
          person_id?: string
          published?: boolean
          their_words?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "curate_drops_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "curate_people"
            referencedColumns: ["id"]
          },
        ]
      }
      recs: {
        Row: {
          created_at: string
          from_user: string
          id: string
          item_id: string
          landed_at: string | null
          to_user: string | null
          token: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          item_id: string
          landed_at?: string | null
          to_user?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          item_id?: string
          landed_at?: string | null
          to_user?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "recs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recs_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recs_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          href: string | null
          id: string
          kind: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          href?: string | null
          id?: string
          kind: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_items: {
        Row: {
          added_at: string
          curate_drop_id: string | null
          done_at: string | null
          id: string
          item_id: string | null
          source: string
          source_rec_id: string | null
          user_id: string
          verdict: string | null
        }
        Insert: {
          added_at?: string
          curate_drop_id?: string | null
          done_at?: string | null
          id?: string
          item_id?: string | null
          source?: string
          source_rec_id?: string | null
          user_id: string
          verdict?: string | null
        }
        Update: {
          added_at?: string
          curate_drop_id?: string | null
          done_at?: string | null
          id?: string
          item_id?: string | null
          source?: string
          source_rec_id?: string | null
          user_id?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_curate_drop_id_fkey"
            columns: ["curate_drop_id"]
            isOneToOne: false
            referencedRelation: "curate_drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      taste_reads: {
        Row: {
          card_data: Json
          generated_at: string
          id: string
          user_id: string
        }
        Insert: {
          card_data?: Json
          generated_at?: string
          id?: string
          user_id: string
        }
        Update: {
          card_data?: Json
          generated_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "taste_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vibe_reads: {
        Row: {
          card_data: Json
          generated_at: string
          group_id: string
          id: string
          period_start: string | null
          source: string
          summary: string
        }
        Insert: {
          card_data?: Json
          generated_at?: string
          group_id: string
          id?: string
          period_start?: string | null
          source?: string
          summary: string
        }
        Update: {
          card_data?: Json
          generated_at?: string
          group_id?: string
          id?: string
          period_start?: string | null
          source?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_reads_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invite_code: { Args: never; Returns: string }
      is_group_member: { Args: { p_group_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
