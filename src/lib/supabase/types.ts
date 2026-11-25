/**
 * types.ts — TypeScript types for the Supabase schema (migration 0001).
 *
 * Defines the `Database` interface consumed by the typed Supabase client
 * (`createClient<Database>(...)`). Every table's Row / Insert / Update shape
 * mirrors the SQL schema so the next-batch route cutover is type-safe.
 *
 * Keep this in sync with supabase/migrations/0001_initial_schema.sql.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          email_verified: boolean;
          full_name: string | null;
          account_type: 'candidate' | 'admin';
          status: 'active' | 'suspended' | 'deleted';
          consent_version: string | null;
          consent_at: string | null;
          marketing_consent: boolean;
          marketing_consent_at: string | null;
          token_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          email_verified?: boolean;
          full_name?: string | null;
          account_type?: 'candidate' | 'admin';
          status?: 'active' | 'suspended' | 'deleted';
          consent_version?: string | null;
          consent_at?: string | null;
          marketing_consent?: boolean;
          marketing_consent_at?: string | null;
          token_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      admin_roles: {
        Row: {
          user_id: string;
          role: 'super_admin' | 'admin' | 'editor' | 'viewer';
          granted_by: string | null;
          granted_at: string;
          suspended_at: string | null;
          suspended_by: string | null;
        };
        Insert: {
          user_id: string;
          role: 'super_admin' | 'admin' | 'editor' | 'viewer';
          granted_by?: string | null;
          granted_at?: string;
          suspended_at?: string | null;
          suspended_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['admin_roles']['Insert']>;
      };
      candidate_profiles: {
        Row: {
          user_id: string;
          headline: string | null;
          summary: string | null;
          current_location: string | null;
          preferred_locations: string[];
          preferred_employment_type: 'Full Time' | 'Part Time' | 'Contract' | 'Internship' | null;
          work_mode_preference: 'Remote' | 'Onsite' | 'Hybrid' | null;
          total_experience_years: number | null;
          current_designation: string | null;
          phone: string | null;
          domain: string | null;
          job_alert_enabled: boolean;
          matching_threshold: number;
          last_alert_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          headline?: string | null;
          summary?: string | null;
          current_location?: string | null;
          preferred_locations?: string[];
          preferred_employment_type?: 'Full Time' | 'Part Time' | 'Contract' | 'Internship' | null;
          work_mode_preference?: 'Remote' | 'Onsite' | 'Hybrid' | null;
          total_experience_years?: number | null;
          current_designation?: string | null;
          phone?: string | null;
          domain?: string | null;
          job_alert_enabled?: boolean;
          matching_threshold?: number;
          last_alert_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['candidate_profiles']['Insert']>;
      };
      candidate_skills: {
        Row: { id: string; candidate_id: string; skill: string; proficiency: string | null; source: string };
        Insert: { id?: string; candidate_id: string; skill: string; proficiency?: string | null; source?: string };
        Update: Partial<Database['public']['Tables']['candidate_skills']['Insert']>;
      };
      candidate_experience: {
        Row: { id: string; candidate_id: string; company: string; designation: string | null; start_date: string | null; end_date: string | null; is_current: boolean; description: string | null };
        Insert: { id?: string; candidate_id: string; company: string; designation?: string | null; start_date?: string | null; end_date?: string | null; is_current?: boolean; description?: string | null };
        Update: Partial<Database['public']['Tables']['candidate_experience']['Insert']>;
      };
      candidate_education: {
        Row: { id: string; candidate_id: string; institution: string; degree: string | null; field: string | null; start_year: number | null; end_year: number | null };
        Insert: { id?: string; candidate_id: string; institution: string; degree?: string | null; field?: string | null; start_year?: number | null; end_year?: number | null };
        Update: Partial<Database['public']['Tables']['candidate_education']['Insert']>;
      };
      candidate_projects: {
        Row: { id: string; candidate_id: string; name: string; description: string | null; tech_stack: string[]; url: string | null; role: string | null };
        Insert: { id?: string; candidate_id: string; name: string; description?: string | null; tech_stack?: string[]; url?: string | null; role?: string | null };
        Update: Partial<Database['public']['Tables']['candidate_projects']['Insert']>;
      };
      candidate_certifications: {
        Row: { id: string; candidate_id: string; name: string; issuer: string | null; issued_date: string | null; expiry_date: string | null; url: string | null };
        Insert: { id?: string; candidate_id: string; name: string; issuer?: string | null; issued_date?: string | null; expiry_date?: string | null; url?: string | null };
        Update: Partial<Database['public']['Tables']['candidate_certifications']['Insert']>;
      };
      resumes: {
        Row: { id: string; candidate_id: string; storage_path: string; file_name: string; content_type: string; size_bytes: number | null; uploaded_at: string; parsed_at: string | null; deleted_at: string | null };
        Insert: { id?: string; candidate_id: string; storage_path: string; file_name: string; content_type: string; size_bytes?: number | null; uploaded_at?: string; parsed_at?: string | null; deleted_at?: string | null };
        Update: Partial<Database['public']['Tables']['resumes']['Insert']>;
      };
      jobs: {
        Row: {
          id: string;
          job_id: string | null;
          title: string;
          department: string | null;
          location: string;
          employment_type: 'Full Time' | 'Part Time' | 'Contract' | 'Internship';
          work_arrangement: 'Remote' | 'Onsite' | 'Hybrid';
          experience_required: string | null;
          skills: string[];
          preferred_skills: string[];
          seniority: string | null;
          education_required: string | null;
          description: string | null;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string; job_id?: string | null; title: string; department?: string | null; location: string;
          employment_type?: 'Full Time' | 'Part Time' | 'Contract' | 'Internship';
          work_arrangement?: 'Remote' | 'Onsite' | 'Hybrid';
          experience_required?: string | null; skills?: string[]; preferred_skills?: string[];
          seniority?: string | null; education_required?: string | null; description?: string | null;
          is_active?: boolean; deleted_at?: string | null; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
      };
      job_applications: {
        Row: {
          id: string; application_id: string; job_id: string; candidate_id: string;
          candidate_email: string; candidate_name: string | null; cover_letter: string | null;
          expected_salary: string | null; notice_period: string | null; preferred_job_location: string | null;
          match_score: number | null; applied_via: string; status: 'New' | 'Reviewed' | 'Shortlisted' | 'Interview' | 'Offered' | 'Rejected' | 'Withdrawn';
          confirmation_email: Json | null; applied_at: string; deleted_at: string | null;
        };
        Insert: {
          id?: string; application_id: string; job_id: string; candidate_id: string;
          candidate_email: string; candidate_name?: string | null; cover_letter?: string | null;
          expected_salary?: string | null; notice_period?: string | null; preferred_job_location?: string | null;
          match_score?: number | null; applied_via?: string; status?: Database['public']['Tables']['job_applications']['Row']['status'];
          confirmation_email?: Json | null; applied_at?: string; deleted_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['job_applications']['Insert']>;
      };
      job_match_results: {
        Row: { id: string; job_id: string; candidate_id: string; overall_score: number; eligibility: 'eligible' | 'ineligible'; matched_required_skills: string[]; missing_required_skills: string[]; matched_preferred_skills: string[]; reasons: string[]; computed_at: string };
        Insert: { id?: string; job_id: string; candidate_id: string; overall_score: number; eligibility: 'eligible' | 'ineligible'; matched_required_skills?: string[]; missing_required_skills?: string[]; matched_preferred_skills?: string[]; reasons?: string[]; computed_at?: string };
        Update: Partial<Database['public']['Tables']['job_match_results']['Insert']>;
      };
      job_alert_preferences: {
        Row: { candidate_id: string; enabled: boolean; threshold: number; last_alert_at: string | null; updated_at: string };
        Insert: { candidate_id: string; enabled?: boolean; threshold?: number; last_alert_at?: string | null; updated_at?: string };
        Update: Partial<Database['public']['Tables']['job_alert_preferences']['Insert']>;
      };
      job_alert_events: {
        Row: { id: string; candidate_id: string; job_id: string; sent_at: string; email_status: 'sent' | 'failed' | 'skipped' };
        Insert: { id?: string; candidate_id: string; job_id: string; sent_at?: string; email_status?: 'sent' | 'failed' | 'skipped' };
        Update: Partial<Database['public']['Tables']['job_alert_events']['Insert']>;
      };
      newsletter_subscribers: {
        Row: { id: string; email: string; source: string; subscribed_at: string; deleted_at: string | null; unsubscribed_at: string | null; confirmation_email: Json | null };
        Insert: { id?: string; email: string; source?: string; subscribed_at?: string; deleted_at?: string | null; unsubscribed_at?: string | null; confirmation_email?: Json | null };
        Update: Partial<Database['public']['Tables']['newsletter_subscribers']['Insert']>;
      };
      contact_enquiries: {
        Row: { id: string; name: string; email: string; company: string | null; role: string | null; business_problem: string; required_service: string | null; project_description: string | null; scope: string | null; budget: string | null; timeline: string | null; preferred_contact: string | null; additional_info: string | null; marketing_consent: boolean; submitted_at: string; status: 'New' | 'Contacted' | 'Qualified' | 'Closed' | 'Spam'; deleted_at: string | null };
        Insert: { id?: string; name: string; email: string; company?: string | null; role?: string | null; business_problem: string; required_service?: string | null; project_description?: string | null; scope?: string | null; budget?: string | null; timeline?: string | null; preferred_contact?: string | null; additional_info?: string | null; marketing_consent?: boolean; submitted_at?: string; status?: Database['public']['Tables']['contact_enquiries']['Row']['status']; deleted_at?: string | null };
        Update: Partial<Database['public']['Tables']['contact_enquiries']['Insert']>;
      };
      email_delivery_events: {
        Row: { id: string; recipient: string; template: string; subject: string; status: 'sent' | 'failed' | 'skipped'; detail: string | null; message_id: string | null; related_type: string | null; related_id: string | null; sent_at: string };
        Insert: { id?: string; recipient: string; template: string; subject: string; status: 'sent' | 'failed' | 'skipped'; detail?: string | null; message_id?: string | null; related_type?: string | null; related_id?: string | null; sent_at?: string };
        Update: Partial<Database['public']['Tables']['email_delivery_events']['Insert']>;
      };
      audit_logs: {
        Row: { id: string; actor_id: string | null; actor_email: string | null; action: string; target_type: string | null; target_id: string | null; ip_hash: string | null; detail: Json | null; created_at: string };
        Insert: { id?: string; actor_id?: string | null; actor_email?: string | null; action: string; target_type?: string | null; target_id?: string | null; ip_hash?: string | null; detail?: Json | null; created_at?: string };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      services: {
        Row: { id: string; slug: string; title: string; summary: string | null; description: string | null; icon: string | null; is_active: boolean; sort_order: number; deleted_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; title: string; summary?: string | null; description?: string | null; icon?: string | null; is_active?: boolean; sort_order?: number; deleted_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      blog_posts: {
        Row: { id: string; slug: string; title: string; excerpt: string | null; content: string | null; cover_image: string | null; author: string | null; is_published: boolean; published_at: string | null; deleted_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; title: string; excerpt?: string | null; content?: string | null; cover_image?: string | null; author?: string | null; is_published?: boolean; published_at?: string | null; deleted_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['blog_posts']['Insert']>;
      };
      tech_ecosystem: {
        Row: { id: string; slug: string; name: string; category: string | null; description: string | null; logo: string | null; is_active: boolean; sort_order: number; deleted_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; name: string; category?: string | null; description?: string | null; logo?: string | null; is_active?: boolean; sort_order?: number; deleted_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['tech_ecosystem']['Insert']>;
      };
      testimonials: {
        Row: { id: string; client_name: string; client_role: string | null; company: string | null; content: string; rating: number | null; is_published: boolean; sort_order: number; deleted_at: string | null; created_at: string };
        Insert: { id?: string; client_name: string; client_role?: string | null; company?: string | null; content: string; rating?: number | null; is_published?: boolean; sort_order?: number; deleted_at?: string | null; created_at?: string };
        Update: Partial<Database['public']['Tables']['testimonials']['Insert']>;
      };
      client_projects: {
        Row: { id: string; slug: string; title: string; client: string | null; summary: string | null; description: string | null; technologies: string[]; image: string | null; is_published: boolean; deleted_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; title: string; client?: string | null; summary?: string | null; description?: string | null; technologies?: string[]; image?: string | null; is_published?: boolean; deleted_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['client_projects']['Insert']>;
      };
      app_settings: {
        Row: { key: string; value: Json; updated_at: string; updated_by: string | null };
        Insert: { key: string; value: Json; updated_at?: string; updated_by?: string | null };
        Update: Partial<Database['public']['Tables']['app_settings']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      owns_candidate_row: { Args: { candidate_id: string }; Returns: boolean };
    };
    Enums: {
      account_type: 'candidate' | 'admin';
      user_status: 'active' | 'suspended' | 'deleted';
      admin_role: 'super_admin' | 'admin' | 'editor' | 'viewer';
      employment_type: 'Full Time' | 'Part Time' | 'Contract' | 'Internship';
      work_arrangement: 'Remote' | 'Onsite' | 'Hybrid';
      application_status: 'New' | 'Reviewed' | 'Shortlisted' | 'Interview' | 'Offered' | 'Rejected' | 'Withdrawn';
      email_status: 'sent' | 'failed' | 'skipped';
      enquiry_status: 'New' | 'Contacted' | 'Qualified' | 'Closed' | 'Spam';
      match_eligibility: 'eligible' | 'ineligible';
    };
  };
}

export type SupabaseClientTyped = import('@supabase/supabase-js').SupabaseClient<Database>;
