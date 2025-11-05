Param(
  [switch]$Yes
)

<#
  deploy.ps1
  Simple helper to run `firebase deploy` from Windows (PowerShell).
  Usage:
    .\deploy.ps1          # prompts for confirmation
    .\deploy.ps1 -Yes     # run without prompt

  Requires: firebase CLI available on PATH (npm i -g firebase-tools)
#>

function Abort($msg){ Write-Host $msg -ForegroundColor Red; exit 1 }

if (-not (Get-Command firebase -ErrorAction SilentlyContinue)){
  Abort "firebase CLI not found. Install it with: npm i -g firebase-tools\nOr install Node.js and then run: npm i -g firebase-tools"
}

Write-Host "Working directory: $PWD" -ForegroundColor Cyan

if (-not $Yes){
  $confirm = Read-Host "Run 'firebase deploy' from this folder? (y/N)"
  if ($confirm -notmatch '^[Yy]'){
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
  }
}

try{
  firebase deploy
  exit $LastExitCode
} catch {
  Write-Host "firebase deploy failed: $_" -ForegroundColor Red
  exit 1
}
