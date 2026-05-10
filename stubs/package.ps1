# stubs/package.ps1
# Builds the Forge stub binaries via the default CMake preset, zips each one,
# and reports the SHA-256 values needed for manifest.json.

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$buildDir = Join-Path $repoRoot 'core\build\default\stubs\Debug'
$distDir = Join-Path $PSScriptRoot 'dist'

Write-Host "Building stub targets..."
Push-Location $repoRoot
try {
    cmake --build --preset default --target forge-stub-success forge-stub-crash
    if ($LASTEXITCODE -ne 0) {
        throw "cmake --build failed with exit code $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

if (Test-Path $distDir) {
    Remove-Item -Recurse -Force $distDir
}
New-Item -ItemType Directory -Path $distDir | Out-Null

$pairs = @(
    @{ exe = 'forge-stub-success.exe'; zip = 'forge-stub-success-windows-x64.zip' },
    @{ exe = 'forge-stub-crash.exe';   zip = 'forge-stub-crash-windows-x64.zip' }
)

Write-Host ''
Write-Host 'Zipped artifacts and SHA-256 values:'
foreach ($pair in $pairs) {
    $exePath = Join-Path $buildDir $pair.exe
    $zipPath = Join-Path $distDir $pair.zip

    if (-not (Test-Path $exePath)) {
        throw "Built executable not found: $exePath"
    }

    Compress-Archive -Path $exePath -DestinationPath $zipPath -Force
    $hash = (Get-FileHash $zipPath -Algorithm SHA256).Hash.ToLower()
    Write-Host ("  {0,-44}  sha256={1}" -f $pair.zip, $hash)
}

Write-Host ''
Write-Host "Output directory: $distDir"
Write-Host 'Upload these zips to a "stubs-1.0.0" release on the Forge repo, then paste the SHA-256 values back to update manifest.json.'
