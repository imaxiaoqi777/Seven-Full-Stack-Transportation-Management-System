param(
  [string]$IconPath = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $PSScriptRoot "ContainerTransportWebLauncher.cs"
$outputPath = Join-Path $projectRoot "dist-web/Start-Container-Transport.exe"

if ([string]::IsNullOrWhiteSpace($IconPath)) {
  $defaultIconPath = Join-Path $projectRoot "app/favicon.ico"
  if (Test-Path $defaultIconPath) {
    $IconPath = $defaultIconPath
  }
}

if (-not (Test-Path $sourcePath)) {
  throw "Launcher source not found: $sourcePath"
}

if (-not (Test-Path (Join-Path $projectRoot "dist-web/server.js"))) {
  throw "dist-web/server.js was not found. Build the web package first."
}

if ($IconPath -and -not (Test-Path $IconPath)) {
  throw "Icon file was not found: $IconPath"
}

if (Test-Path $outputPath) {
  Remove-Item $outputPath -Force
}

$provider = New-Object Microsoft.CSharp.CSharpCodeProvider
$parameters = New-Object System.CodeDom.Compiler.CompilerParameters
$parameters.GenerateExecutable = $true
$parameters.OutputAssembly = $outputPath
$parameters.GenerateInMemory = $false
$parameters.CompilerOptions = "/target:winexe /optimize"
$parameters.ReferencedAssemblies.Add("System.dll") | Out-Null
$parameters.ReferencedAssemblies.Add("System.Core.dll") | Out-Null
$parameters.ReferencedAssemblies.Add("System.Windows.Forms.dll") | Out-Null

if ($IconPath) {
  $resolvedIconPath = (Resolve-Path $IconPath).Path
  $parameters.CompilerOptions += " /win32icon:`"$resolvedIconPath`""
}

$source = Get-Content -Path $sourcePath -Raw -Encoding UTF8
$result = $provider.CompileAssemblyFromSource($parameters, $source)

if ($result.Errors.HasErrors) {
  $messages = $result.Errors | ForEach-Object { $_.ToString() }
  throw ("Launcher build failed:`r`n" + ($messages -join "`r`n"))
}

Write-Output "Launcher created: $outputPath"
if ($IconPath) {
  Write-Output "Launcher icon: $((Resolve-Path $IconPath).Path)"
}
