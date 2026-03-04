param(
  [string]$ServiceName = "SFX_PreDouane",
  [string]$NssmPath = ""
)

$ErrorActionPreference = "Stop"

$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nssm64 = Join-Path $appDir "nssm-2.24\\win64\\nssm.exe"
$nssm32 = Join-Path $appDir "nssm-2.24\\win32\\nssm.exe"

if ([string]::IsNullOrWhiteSpace($NssmPath)) {
  if (Test-Path $nssm64) {
    $NssmPath = $nssm64
  } elseif (Test-Path $nssm32) {
    $NssmPath = $nssm32
  } else {
    $NssmPath = "nssm"
  }
}

if (-not (Get-Command $NssmPath -ErrorAction SilentlyContinue)) {
  throw "NSSM introuvable. Installe NSSM puis relance (https://nssm.cc/download)."
}

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $existing) {
  Write-Host "Le service '$ServiceName' n'existe pas."
  exit 0
}

Write-Host "Arret du service '$ServiceName'..."
& $NssmPath stop $ServiceName | Out-Null

Write-Host "Suppression du service '$ServiceName'..."
& $NssmPath remove $ServiceName confirm | Out-Null

Write-Host "Service supprime."
