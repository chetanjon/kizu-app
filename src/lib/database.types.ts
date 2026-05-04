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
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_members: {
        Row: {
          id: string
          is_home: boolean
          joined_at: string
          pack_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_home?: boolean
          joined_at?: string
          pack_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_home?: boolean
          joined_at?: string
          pack_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_members_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      packs: {
        Row: {
          color_a: string
          color_b: string
          created_at: string
          created_by: string
          founding_date: string
          icon: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          color_a: string
          color_b: string
          created_at?: string
          created_by: string
          founding_date: string
          icon: string
          id?: string
          invite_code: string
          name: string
        }
        Update: {
          color_a?: string
          color_b?: string
          created_at?: string
          created_by?: string
          founding_date?: string
          icon?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "packs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          created_at: string
          id: string
          image_url: string
          kind: string
          local_date: string
          pack_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          image_url: string
          kind: string
          local_date: string
          pack_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          image_url?: string
          kind?: string
          local_date?: string
          pack_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invite_code: { Args: never; Returns: string }
      is_pack_member: { Args: { p_pack_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
