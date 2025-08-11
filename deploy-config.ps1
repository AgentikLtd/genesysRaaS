# deploy-config.ps1 - Project Configuration for genesysRaaS
$Global:PROJECT_ID = "quantum-lambda-383416"
$Global:PROJECT_NUMBER = "182819823853"
$Global:SERVICE_NAME = "genesysraas"
$Global:APP_NAME = "genesysRaaS"
$Global:REGION = "europe-west2"

# Genesys Configuration
$Global:GENESYS_ENVIRONMENT = "euw2.pure.cloud"
$Global:GENESYS_CLIENT_ID = "8e982e76-cfe5-43ed-8c81-1c89ccaaebfc"
$Global:RULES_TABLE_ID = "8d693c19-edea-410d-b3a7-5afd6f45b3c2"

Write-Host "Configuration loaded for project: $PROJECT_ID" -ForegroundColor Green
Write-Host "Genesys Environment: $GENESYS_ENVIRONMENT" -ForegroundColor Cyan