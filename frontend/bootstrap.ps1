# Writes android/local.properties (flutter.sdk, optional sdk.dir).
# Usage: .\bootstrap.ps1
# Or:    $env:FLUTTER_ROOT = "C:\path\to\flutter"; .\bootstrap.ps1

$ErrorActionPreference = "Stop"
$frontend = Split-Path -Parent $MyInvocation.MyCommand.Path
$localProps = Join-Path $frontend "android\local.properties"

$flutterSdk = $env:FLUTTER_ROOT
if (-not $flutterSdk) {
  $flutterCmd = Get-Command flutter -ErrorAction SilentlyContinue
  if ($flutterCmd -and $flutterCmd.Source) {
    $flutterSdk = Split-Path (Split-Path $flutterCmd.Source)
  }
}
if (-not $flutterSdk) {
  Write-Host "Flutter SDK not found. Options:"
  Write-Host "  1) Add Flutter bin to PATH, then re-run this script"
  Write-Host "  2) Set FLUTTER_ROOT then re-run: `$env:FLUTTER_ROOT = 'C:\path\to\flutter'"
  Write-Host "  3) Create $localProps with line: flutter.sdk=C:\path\to\flutter"
  exit 1
}

$flutterSdk = $flutterSdk.TrimEnd('\', '/')
$sdkDir = $env:ANDROID_HOME
if (-not $sdkDir) { $sdkDir = $env:ANDROID_SDK_ROOT }

$lines = @()
$lines += "flutter.sdk=$flutterSdk"
if ($sdkDir) {
  $lines += "sdk.dir=$($sdkDir.Replace('\', '/'))"
}
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines($localProps, $lines, $utf8NoBom)
Write-Host "Wrote $localProps"
Write-Host "flutter.sdk=$flutterSdk"
