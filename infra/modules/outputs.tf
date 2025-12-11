output "project_files_bucket_id" {
  description = "ID of the project files storage bucket"
  value       = supabase_storage_bucket.project_files.id
}

output "avatars_bucket_id" {
  description = "ID of the avatars storage bucket"
  value       = supabase_storage_bucket.avatars.id
}

output "supabase_url" {
  description = "Supabase project URL"
  value       = "https://${var.project_ref}.supabase.co"
}

output "environment" {
  description = "Current environment"
  value       = var.environment
}
