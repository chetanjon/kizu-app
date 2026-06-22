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
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          next_sunset_at: string | null
          sunset_frequency: string
          timezone: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          next_sunset_at?: string | null
          sunset_frequency?: string
          timezone?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          next_sunset_at?: string | null
          sunset_frequency?: string
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
          created_at: string
          created_by: string
          data: Json
          group_id: string
          id: string
          note: string | null
          rating_style: string | null
          rating_value: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data?: Json
          group_id: string
          id?: string
          note?: string | null
          rating_style?: string | null
          rating_value?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data?: Json
          group_id?: string
          id?: string
          note?: string | null
          rating_style?: string | null
          rating_value?: string | null
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
      vibe_reads: {
        Row: {
          card_data: Json
          generated_at: string
          group_id: string
          id: string
          summary: string
        }
        Insert: {
          card_data?: Json
          generated_at?: string
          group_id: string
          id?: string
          summary: string
        }
        Update: {
          card_data?: Json
          generated_at?: string
          group_id?: string
          id?: string
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
