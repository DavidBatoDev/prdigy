#!/usr/bin/env pwsh
# Quick setup script for Prodigi Work Hub

Write-Host "🚀 Prodigi Work Hub - Quick Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-Not (Test-Path "api") -or -Not (Test-Path "web")) {
    Write-Host "❌ Error: Run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Step 1: Apply database migrations
Write-Host "📊 Step 1: Applying database migrations..." -ForegroundColor Yellow
Set-Location api
$migrationOutput = npx supabase db push 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Migration failed. Make sure you've linked to Supabase:" -ForegroundColor Yellow
    Write-Host "   npx supabase login" -ForegroundColor Gray
    Write-Host "   npx supabase link --project-ref ftuiloyegcipkupbtias" -ForegroundColor Gray
} else {
    Write-Host "✅ Migrations applied successfully!" -ForegroundColor Green
}
Set-Location ..

# Step 2: Check for .env files
Write-Host ""
Write-Host "🔐 Step 2: Checking environment variables..." -ForegroundColor Yellow

if (-Not (Test-Path "api\.env")) {
    Write-Host "⚠️  api/.env not found. Copying from example..." -ForegroundColor Yellow
    Copy-Item "api\.env.example" "api\.env"
    Write-Host "   📝 Please edit api/.env with your Supabase credentials" -ForegroundColor Cyan
}

if (-Not (Test-Path "web\.env")) {
    Write-Host "⚠️  web/.env not found. Copying from example..." -ForegroundColor Yellow
    Copy-Item "web\.env.example" "web\.env"
    Write-Host "   📝 Please edit web/.env with your Supabase credentials" -ForegroundColor Cyan
}

# Step 3: Get Supabase project info
Write-Host ""
Write-Host "📋 Step 3: Supabase project info..." -ForegroundColor Yellow
Set-Location api
npx supabase projects list
Set-Location ..

# Final instructions
Write-Host ""
Write-Host "✨ Setup checklist:" -ForegroundColor Cyan
Write-Host "   [ ] Configure api/.env with Supabase credentials" -ForegroundColor White
Write-Host "   [ ] Configure web/.env with Supabase credentials" -ForegroundColor White
Write-Host "   [ ] Run API: cd api && npm run dev" -ForegroundColor White
Write-Host "   [ ] Run Web: cd web && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed setup instructions, see SETUP.md" -ForegroundColor Gray
Write-Host ""
