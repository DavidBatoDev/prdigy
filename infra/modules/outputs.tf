output "supabase_url" {
  description = "Supabase project URL"
  value       = "https://${var.project_ref}.supabase.co"
}

output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "migrations_applied" {
  description = "Indicates migrations have been applied"
  value       = null_resource.apply_migrations.id
}
