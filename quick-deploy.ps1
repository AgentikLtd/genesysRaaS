# quick-deploy.ps1 - One-click deployment for genesysRaaS

Write-Host ""
Write-Host "GENESYSRAAS QUICK DEPLOYMENT" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Set project and region
gcloud config set project quantum-lambda-383416
gcloud config set run/region europe-west2

# Enable required APIs
Write-Host ""
Write-Host "Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com --project quantum-lambda-383416

# Deploy the application
Write-Host ""
Write-Host "Deploying application (this may take 5-10 minutes)..." -ForegroundColor Yellow

$deployResult = gcloud run deploy genesysraas --source . --platform managed --region europe-west2 --allow-unauthenticated --port 8080 --memory 512Mi --project quantum-lambda-383416 2>&1

if ($LASTEXITCODE -eq 0) {
    # Get the deployed URL
    $url = gcloud run services describe genesysraas --region europe-west2 --format "value(status.url)" --project quantum-lambda-383416
    
    # Set environment variables
    Write-Host ""
    Write-Host "Setting environment variables..." -ForegroundColor Yellow
    
    $envVars = "VITE_GENESYS_ENVIRONMENT=euw2.pure.cloud,VITE_GENESYS_CLIENT_ID=8e982e76-cfe5-43ed-8c81-1c89ccaaebfc,VITE_REDIRECT_URI=$url,VITE_RULES_TABLE_ID=8d693c19-edea-410d-b3a7-5afd6f45b3c2"
    
    gcloud run services update genesysraas --set-env-vars=$envVars --region europe-west2 --project quantum-lambda-383416
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your application is live at:" -ForegroundColor Cyan
    Write-Host $url -ForegroundColor Green
    Write-Host ""
    
    # Try to copy to clipboard if available
    try {
        $url | Set-Clipboard
        Write-Host "URL copied to clipboard!" -ForegroundColor Gray
    }
    catch {
        # Clipboard not available, no problem
    }
    
    Write-Host ""
    Write-Host "CRITICAL NEXT STEP:" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    Write-Host "Update your Genesys OAuth Client:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Open Genesys Cloud: https://apps.euw2.pure.cloud" -ForegroundColor White
    Write-Host "2. Go to: Admin > Integrations > OAuth" -ForegroundColor White
    Write-Host "3. Find OAuth Client ID: 8e982e76-cfe5-43ed-8c81-1c89ccaaebfc" -ForegroundColor White
    Write-Host "4. Add this URL to Authorized Redirect URIs:" -ForegroundColor White
    Write-Host "   $url" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Yellow
}
else {
    Write-Host ""
    Write-Host "Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "1. Run: gcloud auth login" -ForegroundColor White
    Write-Host "2. Ensure billing is enabled for the project" -ForegroundColor White
    Write-Host "3. Check you're in the correct directory with Dockerfile" -ForegroundColor White
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $deployResult
}