terraform {
  required_version = ">= 1.5.0"
}

# Include shared provider configuration
module "supabase_infrastructure" {
  source = "../../modules"

  supabase_access_token = var.supabase_access_token
  project_ref          = var.project_ref
  environment          = "dev"
  supabase_db_password = var.supabase_db_password
}

# Output the module outputs
output "project_files_bucket_id" {
  value = module.supabase_infrastructure.project_files_bucket_id
}

output "avatars_bucket_id" {
  value = module.supabase_infrastructure.avatars_bucket_id
}

output "supabase_url" {
  value = module.supabase_infrastructure.supabase_url
}
