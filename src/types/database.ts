export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppRole = "customer" | "worker" | "cooperative_admin" | "platform_admin"
export type BookingStatus = Database["public"]["Enums"]["booking_status"]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          cooperative_id: string | null
          created_at: string
          district: string | null
          id: string
          label: string | null
          latitude: number | null
          line1: string
          line2: string | null
          longitude: number | null
          postal_code: string | null
          profile_id: string | null
          state: string
          updated_at: string
        }
        Insert: {
          city: string
          cooperative_id?: string | null
          created_at?: string
          district?: string | null
          id?: string
          label?: string | null
          latitude?: number | null
          line1: string
          line2?: string | null
          longitude?: number | null
          postal_code?: string | null
          profile_id?: string | null
          state: string
          updated_at?: string
        }
        Update: {
          city?: string
          cooperative_id?: string | null
          created_at?: string
          district?: string | null
          id?: string
          label?: string | null
          latitude?: number | null
          line1?: string
          line2?: string | null
          longitude?: number | null
          postal_code?: string | null
          profile_id?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_name: string
          id: string
          properties: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_name: string
          id?: string
          properties?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_name?: string
          id?: string
          properties?: Json
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: string
          note: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          note?: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address_id: string
          created_at: string
          customer_id: string
          id: string
          quoted_price_cents: number | null
          requirement: string
          scheduled_end: string | null
          scheduled_start: string
          service_id: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          address_id: string
          created_at?: string
          customer_id: string
          id?: string
          quoted_price_cents?: number | null
          requirement: string
          scheduled_end?: string | null
          scheduled_start: string
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          address_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          quoted_price_cents?: number | null
          requirement?: string
          scheduled_end?: string | null
          scheduled_start?: string
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      complaints: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          body: string
          booking_id: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["complaint_status"]
          subject: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          body: string
          booking_id?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["complaint_status"]
          subject: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          body?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["complaint_status"]
          subject?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          booking_id: string
          created_at: string
          id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperative_members: {
        Row: {
          cooperative_id: string
          created_at: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          cooperative_id: string
          created_at?: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          cooperative_id?: string
          created_at?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "cooperative_members_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooperative_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperatives: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          registration_number: string
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          registration_number: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          registration_number?: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          customer_id: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          worker_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "favorites_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      invoices: {
        Row: {
          booking_id: string
          id: string
          invoice_number: string
          issued_at: string
          payment_id: string | null
          platform_fee_cents: number
          subtotal_cents: number
          total_cents: number
        }
        Insert: {
          booking_id: string
          id?: string
          invoice_number: string
          issued_at?: string
          payment_id?: string | null
          platform_fee_cents?: number
          subtotal_cents: number
          total_cents: number
        }
        Update: {
          booking_id?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          payment_id?: string | null
          platform_fee_cents?: number
          subtotal_cents?: number
          total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          booking_id: string | null
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          body: string
          booking_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          body?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          event_name: string
          id: string
          provider: string
          provider_event_id: string
          received_at: string
        }
        Insert: {
          event_name: string
          id?: string
          provider: string
          provider_event_id: string
          received_at?: string
        }
        Update: {
          event_name?: string
          id?: string
          provider?: string
          provider_event_id?: string
          received_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string
          currency: string
          customer_id: string
          id: string
          provider: string | null
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          verified_at: string | null
          worker_id: string
        }
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          provider?: string | null
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          verified_at?: string | null
          worker_id: string
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          provider?: string | null
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          verified_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "payments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      profile_roles: {
        Row: {
          created_at: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          booking_id: string
          created_at: string
          customer_id: string
          id: string
          rating: number
          worker_id: string
        }
        Insert: {
          body?: string | null
          booking_id: string
          created_at?: string
          customer_id: string
          id?: string
          rating: number
          worker_id: string
        }
        Update: {
          body?: string | null
          booking_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reviews_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_applications: {
        Row: {
          bio: string | null
          cooperative_id: string | null
          created_at: string
          id: string
          profile_id: string
          requested_cooperative: string | null
          reviewer_notes: string | null
          service_interests: string[]
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          years_experience: number
        }
        Insert: {
          bio?: string | null
          cooperative_id?: string | null
          created_at?: string
          id?: string
          profile_id: string
          requested_cooperative?: string | null
          reviewer_notes?: string | null
          service_interests?: string[]
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          years_experience?: number
        }
        Update: {
          bio?: string | null
          cooperative_id?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          requested_cooperative?: string | null
          reviewer_notes?: string | null
          service_interests?: string[]
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "worker_applications_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_applications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_availability: {
        Row: {
          created_at: string
          day_of_week: number
          ends_at: string
          id: string
          is_active: boolean
          starts_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          ends_at: string
          id?: string
          is_active?: boolean
          starts_at: string
          worker_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          ends_at?: string
          id?: string
          is_active?: boolean
          starts_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_availability_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      worker_documents: {
        Row: {
          created_at: string
          document_type: string
          id: string
          storage_path: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          worker_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          id?: string
          storage_path: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          worker_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: string
          storage_path?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_documents_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      worker_services: {
        Row: {
          base_price_cents: number | null
          created_at: string
          service_id: string
          worker_id: string
        }
        Insert: {
          base_price_cents?: number | null
          created_at?: string
          service_id: string
          worker_id: string
        }
        Update: {
          base_price_cents?: number | null
          created_at?: string
          service_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_services_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      worker_skills: {
        Row: {
          created_at: string
          id: string
          name: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_skills_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      workers: {
        Row: {
          active: boolean
          bio: string | null
          completed_jobs: number
          cooperative_id: string
          created_at: string
          profile_id: string
          service_radius_km: number
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          years_experience: number
        }
        Insert: {
          active?: boolean
          bio?: string | null
          completed_jobs?: number
          cooperative_id: string
          created_at?: string
          profile_id: string
          service_radius_km?: number
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          years_experience?: number
        }
        Update: {
          active?: boolean
          bio?: string | null
          completed_jobs?: number
          cooperative_id?: string
          created_at?: string
          profile_id?: string
          service_radius_km?: number
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "workers_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_worker_application: {
        Args: { target_application_id: string; target_cooperative_id: string }
        Returns: undefined
      }
      create_booking_request: {
        Args: {
          target_city: string
          target_line1: string
          target_requirement: string
          target_scheduled_end: string
          target_scheduled_start: string
          target_service_id: string
          target_state: string
          target_worker_id: string
        }
        Returns: string
      }
      earth: { Args: never; Returns: number }
      get_public_worker_locations: {
        Args: never
        Returns: {
          city: string
          latitude: number
          longitude: number
          profile_id: string
          state: string
        }[]
      }
      has_role: {
        Args: { required_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_cooperative_admin: {
        Args: { target_cooperative_id: string }
        Returns: boolean
      }
      update_booking_status: {
        Args: {
          target_booking_id: string
          target_note?: string
          target_status: Database["public"]["Enums"]["booking_status"]
        }
        Returns: undefined
      }
      update_worker_profile: {
        Args: {
          target_bio: string
          target_full_name: string
          target_phone: string
          target_service_radius_km: number
          target_years_experience: number
        }
        Returns: undefined
      }
      worker_average_rating: {
        Args: { target_worker_id: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "customer" | "worker" | "cooperative_admin" | "platform_admin"
      booking_status:
        | "requested"
        | "accepted"
        | "confirmed"
        | "worker_en_route"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "rejected"
        | "disputed"
      complaint_status:
        | "open"
        | "under_review"
        | "resolved"
        | "rejected"
        | "escalated"
      payment_status: "pending" | "processing" | "paid" | "failed" | "refunded"
      verification_status: "pending" | "verified" | "rejected" | "suspended"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["customer", "worker", "cooperative_admin", "platform_admin"],
      booking_status: [
        "requested",
        "accepted",
        "confirmed",
        "worker_en_route",
        "in_progress",
        "completed",
        "cancelled",
        "rejected",
        "disputed",
      ],
      complaint_status: [
        "open",
        "under_review",
        "resolved",
        "rejected",
        "escalated",
      ],
      payment_status: ["pending", "processing", "paid", "failed", "refunded"],
      verification_status: ["pending", "verified", "rejected", "suspended"],
    },
  },
} as const
