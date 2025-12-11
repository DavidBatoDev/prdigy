# Apply database migrations using local-exec provisioner
# This reads migration files and applies them via Supabase API

resource "null_resource" "apply_migrations" {
  # Trigger re-application when migration files change
  triggers = {
    migrations_hash = sha256(join("", [
      for f in fileset("${path.module}/../../api/supabase/migrations", "*.sql") :
      filesha256("${path.module}/../../api/supabase/migrations/${f}")
    ]))
  }

  # Apply migrations using Supabase CLI
  provisioner "local-exec" {
    command     = "cd ${path.module}/../../api; npx supabase link --project-ref ${var.project_ref}; npx supabase db push --include-all"
    interpreter = ["PowerShell", "-Command"]
  }
}
