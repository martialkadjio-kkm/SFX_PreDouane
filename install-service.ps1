param(
  [string]$ServiceName = "SFX_PreDouane",
  [string]$NssmPath = "",
  [ValidateSet("dev", "production")]
  [string]$RunMode = "dev"
)

$ErrorActionPreference = "Stop"

$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeExe = (Get-Command node -ErrorAction Stop).Source
$serverScript = Join-Path $appDir "server.js"
$nextBuildId = Join-Path $appDir ".next\\BUILD_ID"
$logsDir = Join-Path $appDir "service_log"
$stdoutLog = Join-Path $logsDir "service-out.log"
$stderrLog = Join-Path $logsDir "service-err.log"
$nssm64 = Join-Path $appDir "nssm-2.24\\win64\\nssm.exe"

function Invoke-Nssm {
  param(
    [Parameter(Mandatory = $true)][string[]]$Args
  )

  & $NssmPath @Args | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Commande NSSM en echec: $NssmPath $($Args -join ' ')"
  }
}

if ([string]::IsNullOrWhiteSpace($NssmPath)) {
  if (Test-Path $nssm64) {
    $NssmPath = $nssm64
  } else {
    throw "NSSM win64 introuvable: $nssm64"
  }
}

if (-not (Test-Path $serverScript)) {
  throw "Fichier introuvable: $serverScript"
}

if ($RunMode -eq "production" -and -not (Test-Path $nextBuildId)) {
  throw "Build Next.js introuvable (.next\\BUILD_ID). Execute d'abord: npm run build"
}

if (-not (Get-Command $NssmPath -ErrorAction SilentlyContinue)) {
  throw "NSSM introuvable. Installe NSSM puis relance (https://nssm.cc/download)."
}

if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Le service '$ServiceName' existe deja. Suppression..."
  Invoke-Nssm -Args @("stop", $ServiceName)
  Invoke-Nssm -Args @("remove", $ServiceName, "confirm")
}

Write-Host "Installation du service '$ServiceName'..."
Invoke-Nssm -Args @("install", $ServiceName, $nodeExe, $serverScript)
Invoke-Nssm -Args @("set", $ServiceName, "Application", $nodeExe)
# Utiliser un parametre relatif pour eviter les problemes de chemins avec espaces.
Invoke-Nssm -Args @("set", $ServiceName, "AppParameters", "server.js")
Invoke-Nssm -Args @("set", $ServiceName, "AppDirectory", $appDir)
Invoke-Nssm -Args @("set", $ServiceName, "AppEnvironmentExtra", "NODE_ENV=$RunMode")
Invoke-Nssm -Args @("set", $ServiceName, "Start", "SERVICE_AUTO_START")
sc.exe config $ServiceName start= auto | Out-Null
Invoke-Nssm -Args @("set", $ServiceName, "AppStdout", $stdoutLog)
Invoke-Nssm -Args @("set", $ServiceName, "AppStderr", $stderrLog)
Invoke-Nssm -Args @("set", $ServiceName, "AppRotateFiles", "1")
Invoke-Nssm -Args @("set", $ServiceName, "AppRotateOnline", "1")
Invoke-Nssm -Args @("set", $ServiceName, "AppRotateBytes", "10485760")

Write-Host "Demarrage du service '$ServiceName'..."
Invoke-Nssm -Args @("start", $ServiceName)

Write-Host "Service installe et demarre."
Write-Host "Nom: $ServiceName"
Write-Host "AppDirectory: $appDir"
Write-Host "Node: $nodeExe"
Write-Host "Script: $serverScript"
Write-Host "RunMode: $RunMode"
Write-Host "Logs: $stdoutLog / $stderrLog"
