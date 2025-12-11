terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

provider "supabase" {
  access_token = var.supabase_access_token
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
output "supabase_url" {
  value = module.supabase_infrastructure.supabase_url
}

output "environment" {
  value = module.supabase_infrastructure.environment
}

output "migrations_applied" {
  value = module.supabase_infrastructure.migrations_applied
}
