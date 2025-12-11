# Supabase Storage Buckets Module
# Note: Database schema is managed via Supabase CLI migrations

# Project files storage bucket
resource "supabase_storage_bucket" "project_files" {
  name          = "project-files"
  public        = false
  file_size_limit = 52428800  # 50MB
  allowed_mime_types = [
    "image/*",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "text/*"
  ]
}

# User avatars storage bucket
resource "supabase_storage_bucket" "avatars" {
  name          = "avatars"
  public        = true
  file_size_limit = 2097152  # 2MB
  allowed_mime_types = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ]
}

# Storage bucket policies for project files
resource "supabase_storage_bucket_policy" "project_files_select" {
  bucket_name = supabase_storage_bucket.project_files.name
  operation   = "SELECT"
  definition  = <<-SQL
    (
      EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.project_id = (storage.foldername(name))[1]::uuid
        AND project_members.user_id = auth.uid()
      )
    )
  SQL
}

resource "supabase_storage_bucket_policy" "project_files_insert" {
  bucket_name = supabase_storage_bucket.project_files.name
  operation   = "INSERT"
  definition  = <<-SQL
    (
      EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.project_id = (storage.foldername(name))[1]::uuid
        AND project_members.user_id = auth.uid()
      )
    )
  SQL
}

resource "supabase_storage_bucket_policy" "project_files_update" {
  bucket_name = supabase_storage_bucket.project_files.name
  operation   = "UPDATE"
  definition  = <<-SQL
    (
      auth.uid() = (
        SELECT uploaded_by FROM files
        WHERE storage_path = name
      )
    )
  SQL
}

resource "supabase_storage_bucket_policy" "project_files_delete" {
  bucket_name = supabase_storage_bucket.project_files.name
  operation   = "DELETE"
  definition  = <<-SQL
    (
      auth.uid() = (
        SELECT uploaded_by FROM files
        WHERE storage_path = name
      )
      OR
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = (storage.foldername(name))[1]::uuid
        AND projects.consultant_id = auth.uid()
      )
    )
  SQL
}

# Storage bucket policies for avatars
resource "supabase_storage_bucket_policy" "avatars_select" {
  bucket_name = supabase_storage_bucket.avatars.name
  operation   = "SELECT"
  definition  = "true"  # Public read
}

resource "supabase_storage_bucket_policy" "avatars_insert" {
  bucket_name = supabase_storage_bucket.avatars.name
  operation   = "INSERT"
  definition  = <<-SQL
    (
      auth.uid()::text = (storage.foldername(name))[1]
    )
  SQL
}

resource "supabase_storage_bucket_policy" "avatars_update" {
  bucket_name = supabase_storage_bucket.avatars.name
  operation   = "UPDATE"
  definition  = <<-SQL
    (
      auth.uid()::text = (storage.foldername(name))[1]
    )
  SQL
}

resource "supabase_storage_bucket_policy" "avatars_delete" {
  bucket_name = supabase_storage_bucket.avatars.name
  operation   = "DELETE"
  definition  = <<-SQL
    (
      auth.uid()::text = (storage.foldername(name))[1]
    )
  SQL
}
