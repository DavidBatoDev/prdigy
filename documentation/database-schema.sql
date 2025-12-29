

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."channel_type" AS ENUM (
    'all-hands',
    'dev-team',
    'direct'
);


ALTER TYPE "public"."channel_type" OWNER TO "postgres";


CREATE TYPE "public"."meeting_type" AS ENUM (
    'kickoff',
    'status_sync',
    'design_review',
    'qa',
    'scope_clarification',
    'retainer_sync',
    'client_consultant',
    'consultant_freelancer'
);


ALTER TYPE "public"."meeting_type" OWNER TO "postgres";


CREATE TYPE "public"."milestone_status" AS ENUM (
    'pending',
    'in_progress',
    'completed'
);


ALTER TYPE "public"."milestone_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'completed'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."persona_type" AS ENUM (
    'client',
    'freelancer',
    'consultant',
    'admin'
);


ALTER TYPE "public"."persona_type" OWNER TO "postgres";


CREATE TYPE "public"."project_status" AS ENUM (
    'draft',
    'active',
    'paused',
    'completed',
    'archived'
);


ALTER TYPE "public"."project_status" OWNER TO "postgres";


CREATE TYPE "public"."work_item_status" AS ENUM (
    'not_started',
    'in_progress',
    'in_review',
    'completed',
    'blocked'
);


ALTER TYPE "public"."work_item_status" OWNER TO "postgres";


CREATE TYPE "public"."work_item_type" AS ENUM (
    'deliverable',
    'task',
    'asset',
    'issue',
    'bug',
    'setup',
    'integration',
    'design',
    'development'
);


ALTER TYPE "public"."work_item_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Auto-confirm the email (keeps existing behavior)
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = new.id AND email_confirmed_at IS NULL;

  -- Create a minimal profile row; client can upsert additional fields later.
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'handle_new_user failed for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "channel_type" "public"."channel_type" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "recipient_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "version" integer DEFAULT 1,
    "file_size" bigint,
    "mime_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "type" "public"."meeting_type" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "meeting_url" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."meetings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "target_date" timestamp with time zone,
    "status" "public"."milestone_status" DEFAULT 'pending'::"public"."milestone_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."milestones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."password_resets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "user_id" "uuid",
    "code_hash" "text" NOT NULL,
    "salt" "text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:10:00'::interval) NOT NULL,
    "consumed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."password_resets" OWNER TO "postgres";


COMMENT ON TABLE "public"."password_resets" IS 'Stores hashed password reset codes with expiry and consumption flags';



CREATE TABLE IF NOT EXISTS "public"."payment_checkpoints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "milestone_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status",
    "payer_id" "uuid" NOT NULL,
    "payee_id" "uuid" NOT NULL,
    "description" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_checkpoints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "is_consultant_verified" boolean DEFAULT false,
    "active_persona" "public"."persona_type" DEFAULT 'freelancer'::"public"."persona_type",
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "gender" "text",
    "phone_number" "text",
    "country" "text",
    "date_of_birth" "date",
    "city" "text",
    "zip_code" "text",
    "is_email_verified" boolean DEFAULT false,
    "first_name" "text",
    "last_name" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "has_completed_onboarding" boolean DEFAULT false,
    CONSTRAINT "settings_onboarding_structure_check" CHECK ((("settings" IS NULL) OR (("settings")::"text" = '{}'::"text") OR ((("settings" -> 'onboarding'::"text") IS NOT NULL) AND ((("settings" -> 'onboarding'::"text") ->> 'intent'::"text") IS NOT NULL) AND (((("settings" -> 'onboarding'::"text") -> 'intent'::"text") ->> 'freelancer'::"text") = ANY (ARRAY['true'::"text", 'false'::"text"])) AND (((("settings" -> 'onboarding'::"text") -> 'intent'::"text") ->> 'client'::"text") = ANY (ARRAY['true'::"text", 'false'::"text"])) AND ((("settings" -> 'onboarding'::"text") ->> 'completed_at'::"text") IS NOT NULL))))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."settings" IS 'JSONB field for storing user settings including onboarding data with structure: {"onboarding": {"intent": {"freelancer": bool, "client": bool}, "completed_at": timestamp}}';



COMMENT ON COLUMN "public"."profiles"."has_completed_onboarding" IS 'Boolean flag indicating whether user has completed the onboarding flow. Used for routing decisions after authentication.';



CREATE TABLE IF NOT EXISTS "public"."project_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "permissions_json" "jsonb" DEFAULT '{}'::"jsonb",
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "brief" "text",
    "status" "public"."project_status" DEFAULT 'draft'::"public"."project_status",
    "client_id" "uuid" NOT NULL,
    "consultant_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "type" "public"."work_item_type" NOT NULL,
    "status" "public"."work_item_status" DEFAULT 'not_started'::"public"."work_item_status",
    "assignee_id" "uuid",
    "is_client_visible" boolean DEFAULT false,
    "due_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."work_items" OWNER TO "postgres";


ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."milestones"
    ADD CONSTRAINT "milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_resets"
    ADD CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_checkpoints"
    ADD CONSTRAINT "payment_checkpoints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_user_id_key" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_items"
    ADD CONSTRAINT "work_items_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_chat_messages_channel" ON "public"."chat_messages" USING "btree" ("channel_type");



CREATE INDEX "idx_chat_messages_created" ON "public"."chat_messages" USING "btree" ("created_at");



CREATE INDEX "idx_chat_messages_project" ON "public"."chat_messages" USING "btree" ("project_id");



CREATE INDEX "idx_files_project" ON "public"."files" USING "btree" ("project_id");



CREATE INDEX "idx_meetings_project" ON "public"."meetings" USING "btree" ("project_id");



CREATE INDEX "idx_milestones_project" ON "public"."milestones" USING "btree" ("project_id");



CREATE INDEX "idx_payment_checkpoints_payee" ON "public"."payment_checkpoints" USING "btree" ("payee_id");



CREATE INDEX "idx_payment_checkpoints_payer" ON "public"."payment_checkpoints" USING "btree" ("payer_id");



CREATE INDEX "idx_payment_checkpoints_project" ON "public"."payment_checkpoints" USING "btree" ("project_id");



CREATE INDEX "idx_project_members_project" ON "public"."project_members" USING "btree" ("project_id");



CREATE INDEX "idx_project_members_user" ON "public"."project_members" USING "btree" ("user_id");



CREATE INDEX "idx_projects_client" ON "public"."projects" USING "btree" ("client_id");



CREATE INDEX "idx_projects_consultant" ON "public"."projects" USING "btree" ("consultant_id");



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_work_items_assignee" ON "public"."work_items" USING "btree" ("assignee_id");



CREATE INDEX "idx_work_items_project" ON "public"."work_items" USING "btree" ("project_id");



CREATE INDEX "idx_work_items_status" ON "public"."work_items" USING "btree" ("status");



CREATE INDEX "password_resets_created_idx" ON "public"."password_resets" USING "btree" ("created_at" DESC);



CREATE INDEX "password_resets_email_idx" ON "public"."password_resets" USING "btree" ("email");



CREATE OR REPLACE TRIGGER "update_chat_messages_updated_at" BEFORE UPDATE ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_files_updated_at" BEFORE UPDATE ON "public"."files" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_meetings_updated_at" BEFORE UPDATE ON "public"."meetings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_milestones_updated_at" BEFORE UPDATE ON "public"."milestones" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payment_checkpoints_updated_at" BEFORE UPDATE ON "public"."payment_checkpoints" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_work_items_updated_at" BEFORE UPDATE ON "public"."work_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."milestones"
    ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_checkpoints"
    ADD CONSTRAINT "payment_checkpoints_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_checkpoints"
    ADD CONSTRAINT "payment_checkpoints_payee_id_fkey" FOREIGN KEY ("payee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_checkpoints"
    ADD CONSTRAINT "payment_checkpoints_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_checkpoints"
    ADD CONSTRAINT "payment_checkpoints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."work_items"
    ADD CONSTRAINT "work_items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."work_items"
    ADD CONSTRAINT "work_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can delete projects" ON "public"."projects" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."active_persona" = 'admin'::"public"."persona_type")))));



CREATE POLICY "Clients can create projects" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."uid"() = "client_id"));



CREATE POLICY "Consultant and admin can create payments" ON "public"."payment_checkpoints" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "payment_checkpoints"."project_id") AND ("projects"."consultant_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."active_persona" = 'admin'::"public"."persona_type"))))));



CREATE POLICY "Consultant and admin can update payments" ON "public"."payment_checkpoints" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "payment_checkpoints"."project_id") AND ("projects"."consultant_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."active_persona" = 'admin'::"public"."persona_type"))))));



CREATE POLICY "Consultant and assignees can update work items" ON "public"."work_items" FOR UPDATE USING ((("auth"."uid"() = "assignee_id") OR (EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "work_items"."project_id") AND ("projects"."consultant_id" = "auth"."uid"()))))));



CREATE POLICY "Consultant and uploader can delete files" ON "public"."files" FOR DELETE USING ((("auth"."uid"() = "uploaded_by") OR (EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "files"."project_id") AND ("projects"."consultant_id" = "auth"."uid"()))))));



CREATE POLICY "Consultant can add members" ON "public"."project_members" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_members"."project_id") AND ("projects"."consultant_id" = "auth"."uid"())))));



CREATE POLICY "Consultant can create milestones" ON "public"."milestones" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "milestones"."project_id") AND ("projects"."consultant_id" = "auth"."uid"())))));



CREATE POLICY "Consultant can create work items" ON "public"."work_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "work_items"."project_id") AND ("projects"."consultant_id" = "auth"."uid"())))));



CREATE POLICY "Consultant can delete milestones" ON "public"."milestones" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "milestones"."project_id") AND ("projects"."consultant_id" = "auth"."uid"())))));



CREATE POLICY "Consultant can delete work items" ON "public"."work_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "work_items"."project_id") AND ("projects"."consultant_id" = "auth"."uid"())))));



CREATE POLICY "Consultant can remove members" ON "public"."project_members" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_members"."project_id") AND ("projects"."consultant_id" = "auth"."uid"())))));



CREATE POLICY "Consultant can update member roles" ON "public"."project_members" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_members"."project_id") AND ("projects"."consultant_id" = "auth"."uid"())))));



CREATE POLICY "Consultant can update milestones" ON "public"."milestones" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "milestones"."project_id") AND ("projects"."consultant_id" = "auth"."uid"())))));



CREATE POLICY "Creator and consultant can delete meetings" ON "public"."meetings" FOR DELETE USING ((("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "meetings"."project_id") AND ("projects"."consultant_id" = "auth"."uid"()))))));



CREATE POLICY "Meeting creator can update meetings" ON "public"."meetings" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Project members can create meetings" ON "public"."meetings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."project_members"
  WHERE (("project_members"."project_id" = "meetings"."project_id") AND ("project_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Project members can send chat by channel" ON "public"."chat_messages" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."project_members" "pm"
     JOIN "public"."projects" "p" ON (("pm"."project_id" = "p"."id")))
  WHERE (("pm"."project_id" = "chat_messages"."project_id") AND ("pm"."user_id" = "auth"."uid"()) AND (("chat_messages"."channel_type" = 'all-hands'::"public"."channel_type") OR (("chat_messages"."channel_type" = 'dev-team'::"public"."channel_type") AND ("pm"."user_id" <> "p"."client_id")) OR (("chat_messages"."channel_type" = 'direct'::"public"."channel_type") AND (EXISTS ( SELECT 1
           FROM "public"."project_members"
          WHERE (("project_members"."project_id" = "chat_messages"."project_id") AND ("project_members"."user_id" = "chat_messages"."recipient_id"))))))))) AND ("auth"."uid"() = "sender_id")));



CREATE POLICY "Project members can upload files" ON "public"."files" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."project_members"
  WHERE (("project_members"."project_id" = "files"."project_id") AND ("project_members"."user_id" = "auth"."uid"())))) AND ("auth"."uid"() = "uploaded_by")));



CREATE POLICY "Project members can view chat by channel" ON "public"."chat_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."project_members" "pm"
     JOIN "public"."projects" "p" ON (("pm"."project_id" = "p"."id")))
  WHERE (("pm"."project_id" = "chat_messages"."project_id") AND ("pm"."user_id" = "auth"."uid"()) AND (("chat_messages"."channel_type" = 'all-hands'::"public"."channel_type") OR (("chat_messages"."channel_type" = 'dev-team'::"public"."channel_type") AND ("pm"."user_id" <> "p"."client_id")) OR (("chat_messages"."channel_type" = 'direct'::"public"."channel_type") AND (("chat_messages"."sender_id" = "auth"."uid"()) OR ("chat_messages"."recipient_id" = "auth"."uid"()))))))));



CREATE POLICY "Project members can view files" ON "public"."files" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project_members"
  WHERE (("project_members"."project_id" = "files"."project_id") AND ("project_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Project members can view meetings" ON "public"."meetings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project_members"
  WHERE (("project_members"."project_id" = "meetings"."project_id") AND ("project_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Project members can view milestones" ON "public"."milestones" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project_members"
  WHERE (("project_members"."project_id" = "milestones"."project_id") AND ("project_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Project members can view payments" ON "public"."payment_checkpoints" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project_members"
  WHERE (("project_members"."project_id" = "payment_checkpoints"."project_id") AND ("project_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Project members can view projects" ON "public"."projects" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project_members"
  WHERE (("project_members"."project_id" = "projects"."id") AND ("project_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Project members can view team" ON "public"."project_members" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("project_id" IN ( SELECT "project_members_1"."project_id"
   FROM "public"."project_members" "project_members_1"
  WHERE ("project_members_1"."user_id" = "auth"."uid"())))));



CREATE POLICY "Project members can view work items" ON "public"."work_items" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."project_members"
  WHERE (("project_members"."project_id" = "work_items"."project_id") AND ("project_members"."user_id" = "auth"."uid"())))) AND (("is_client_visible" = true) OR ("auth"."uid"() IN ( SELECT "projects"."consultant_id"
   FROM "public"."projects"
  WHERE ("projects"."id" = "work_items"."project_id")
UNION
 SELECT "project_members"."user_id"
   FROM "public"."project_members"
  WHERE (("project_members"."project_id" = "work_items"."project_id") AND ("project_members"."user_id" <> ( SELECT "projects"."client_id"
           FROM "public"."projects"
          WHERE ("projects"."id" = "work_items"."project_id")))))))));



CREATE POLICY "Project owners can update projects" ON "public"."projects" FOR UPDATE USING ((("auth"."uid"() = "client_id") OR ("auth"."uid"() = "consultant_id")));



CREATE POLICY "Uploader can update file metadata" ON "public"."files" FOR UPDATE USING (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Users can delete own messages" ON "public"."chat_messages" FOR DELETE USING (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own messages" ON "public"."chat_messages" FOR UPDATE USING (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meetings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."milestones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."password_resets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_checkpoints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_items" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."files" TO "anon";
GRANT ALL ON TABLE "public"."files" TO "authenticated";
GRANT ALL ON TABLE "public"."files" TO "service_role";



GRANT ALL ON TABLE "public"."meetings" TO "anon";
GRANT ALL ON TABLE "public"."meetings" TO "authenticated";
GRANT ALL ON TABLE "public"."meetings" TO "service_role";



GRANT ALL ON TABLE "public"."milestones" TO "anon";
GRANT ALL ON TABLE "public"."milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."milestones" TO "service_role";



GRANT ALL ON TABLE "public"."password_resets" TO "anon";
GRANT ALL ON TABLE "public"."password_resets" TO "authenticated";
GRANT ALL ON TABLE "public"."password_resets" TO "service_role";



GRANT ALL ON TABLE "public"."payment_checkpoints" TO "anon";
GRANT ALL ON TABLE "public"."payment_checkpoints" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_checkpoints" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_members" TO "anon";
GRANT ALL ON TABLE "public"."project_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_members" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."work_items" TO "anon";
GRANT ALL ON TABLE "public"."work_items" TO "authenticated";
GRANT ALL ON TABLE "public"."work_items" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
