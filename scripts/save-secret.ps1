# 사용법: powershell -ExecutionPolicy Bypass -File scripts\save-secret.ps1 <변수이름> <최소길이>
# 클립보드의 값을 app\.env.local 에 저장하고 클립보드를 비웁니다. 값은 화면에 출력하지 않습니다.
param([Parameter(Mandatory=$true)][string]$Name, [int]$MinLength = 8)
$value = (Get-Clipboard -Raw)
if ($null -eq $value) { $value = "" }
$value = $value.Trim()
if ($value.Length -lt $MinLength) {
  Write-Host "저장하지 않았어요: 클립보드 값이 $MinLength 자보다 짧아요. 값을 다시 복사한 뒤 실행해 주세요." -ForegroundColor Red
  exit 1
}
$envFile = Join-Path $PSScriptRoot "..\app\.env.local"
$lines = @()
if (Test-Path $envFile) { $lines = @(Get-Content $envFile | Where-Object { $_ -notmatch "^$Name=" }) }
$lines += "$Name=$value"
[System.IO.File]::WriteAllLines([System.IO.Path]::GetFullPath($envFile), [string[]]$lines, (New-Object System.Text.UTF8Encoding($false)))
cmd /c "echo off | clip"
Write-Host "$Name 저장 완료 ($($value.Length)자). 클립보드를 비웠어요." -ForegroundColor Green
