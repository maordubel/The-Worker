/**
 * Supabase types.
 *
 * Regenerate with `npm run db:types` — which needs a LINKED project and network access
 * to Maor's Supabase, and therefore cannot be run from the build container that writes
 * these deltas. That is why this file is hand-written today and says so instead of
 * carrying the usual "never hand-edit" banner over something that has been hand-edited.
 *
 * **What is here and what is not.** The seven applied migrations before
 * `20260917090000_portal_identity.sql` are the ARCHIVE — clubs, matches, people, trivia —
 * and nothing in `app/`, `components/` or `lib/` reads them through a typed client yet, so
 * they are not typed here. The portal tables ARE read from the client (the ballot, the
 * card, the collections), so they are, and leaving them out would make every row `never`
 * and every query an `any` in disguise.
 *
 * The moment Maor runs `npm run db:types` against the linked project this file is
 * replaced wholesale by the generator's output, which will contain both halves. Nothing
 * here should be preserved across that: it is a stand-in, not a source of truth.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      app_profile: {
        /**
         * `card`, `card_edited_at`, `shirt_number` and `supporter` arrive with
         * `20260921130000_gates_progress.sql`. Until that SQL runs they do not exist, and
         * `lib/portal/sync.ts` reads and writes without them.
         */
        Row: {
          id: string
          display_name: string | null
          member_no: string | null
          since: string
          card: Json | null
          card_edited_at: string | null
          shirt_number: number | null
          supporter: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          member_no?: string | null
          since?: string
          card?: Json | null
          card_edited_at?: string | null
          shirt_number?: number | null
          supporter?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          member_no?: string | null
          since?: string
          card?: Json | null
          card_edited_at?: string | null
          shirt_number?: number | null
          supporter?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      /**
       * Grow-only: RLS lets the owner READ their rows and nobody write them directly —
       * every write goes through `rpc_collect`, which never deletes.
       */
      profile_item: {
        Row: {
          user_id: string
          set_id: string
          item_id: string
          added_on: string
        }
        Insert: {
          user_id: string
          set_id: string
          item_id: string
          added_on?: string
        }
        Update: {
          user_id?: string
          set_id?: string
          item_id?: string
          added_on?: string
        }
        Relationships: []
      }
      gate_run: {
        Row: {
          id: string
          user_id: string
          gate: string
          seed: number | null
          score: number
          asked: number
          correct: number
          played_on: string
          played_at: string
          idempotency_key: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gate: string
          seed?: number | null
          score?: number
          asked?: number
          correct?: number
          played_on?: string
          played_at?: string
          idempotency_key: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gate?: string
          seed?: number | null
          score?: number
          asked?: number
          correct?: number
          played_on?: string
          played_at?: string
          idempotency_key?: string
          created_at?: string
        }
        Relationships: []
      }
      /**
       * Typed for completeness and unreachable from any client: the table has RLS on
       * and no policy at all, so `from('poll_vote')` answers nothing whoever asks. The
       * ballot goes through `rpc_poll_vote` and comes back only as `rpc_poll_tally`.
       */
      poll_vote: {
        Row: {
          id: string
          device_id: string
          question_id: string
          pick: string
          voted_at: string
        }
        Insert: {
          id?: string
          device_id: string
          question_id: string
          pick: string
          voted_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          question_id?: string
          pick?: string
          voted_at?: string
        }
        Relationships: []
      }
      kit_built: {
        Row: {
          user_id: string
          season_label: string
          variant: string
          first_built_on: string
          best_parts: number
          times: number
          updated_at: string
        }
        Insert: {
          user_id: string
          season_label: string
          variant: string
          first_built_on?: string
          best_parts?: number
          times?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          season_label?: string
          variant?: string
          first_built_on?: string
          best_parts?: number
          times?: number
          updated_at?: string
        }
        Relationships: []
      }
      xi_pick: {
        Row: {
          user_id: string
          tab: string
          formation: string
          picks: Json
          saved_on: string
          updated_at: string
        }
        Insert: {
          user_id: string
          tab: string
          formation: string
          picks?: Json
          saved_on?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          tab?: string
          formation?: string
          picks?: Json
          saved_on?: string
          updated_at?: string
        }
        Relationships: []
      }
      life_save: {
        Row: {
          id: string
          user_id: string
          life_id: string
          seq: number
          event: Json
          save_version: number
          recorded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          life_id?: string
          seq: number
          event: Json
          save_version?: number
          recorded_at?: string
        }
        /** Append-only: a trigger refuses every update. Typed to match the refusal. */
        Update: never
        Relationships: []
      }
      life_checkpoint: {
        Row: {
          user_id: string
          life_id: string
          checkpoint: Json | null
          year: number | null
          updated_at: string
        }
        Insert: {
          user_id: string
          life_id?: string
          checkpoint?: Json | null
          year?: number | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          life_id?: string
          checkpoint?: Json | null
          year?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      rpc_record_run: {
        Args: {
          p_key: string
          p_gate: string
          p_score?: number
          p_asked?: number
          p_correct?: number
          p_seed?: number | null
          p_played_on?: string | null
        }
        Returns: { run_id: string; first_time: boolean }[]
      }
      rpc_collect: {
        Args: { p_set: string; p_ids: string[] }
        Returns: number
      }
      rpc_poll_vote: {
        Args: { p_device_id: string; p_question_id: string; p_pick: string }
        Returns: undefined
      }
      rpc_poll_tally: {
        Args: { p_question_id: string }
        Returns: { pick: string; votes: number }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
