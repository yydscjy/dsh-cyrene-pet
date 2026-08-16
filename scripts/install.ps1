<#
  Install @yydscjy/dsh-cyrene-pet into the dsh web profile.

  1. Copies the package (package.json, lib/, assets/) into
     $DSH_HOME\profiles\node_modules\@yydscjy\dsh-cyrene-pet
  2. Adds the plugin row to $DSH_HOME\profiles\web\cordis.patch.yml (idempotent)
  3. Prints the restart instruction

  Run: powershell -ExecutionPolicy Bypass -File scripts\install.ps1
#>
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$home = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$target = Join-Path $home 'profiles\node_modules\@yydscjy\dsh-cyrene-pet'
$patch = Join-Path $home 'profiles\web\cordis.patch.yml'

Write-Host "==> Installing @yydscjy/dsh-cyrene-pet"
Write-Host "    target: $target"

# 1. copy package files
New-Item -ItemType Directory -Force -Path (Join-Path $target 'lib') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $target 'assets') | Out-Null
Copy-Item (Join-Path $root 'package.json') (Join-Path $target 'package.json') -Force
Copy-Item (Join-Path $root 'lib\index.js') (Join-Path $target 'lib\index.js') -Force
Copy-Item (Join-Path $root 'lib\invariant.js') (Join-Path $target 'lib\invariant.js') -Force
Copy-Item (Join-Path $root 'lib\client.js') (Join-Path $target 'lib\client.js') -Force
Get-ChildItem (Join-Path $root 'assets') -File | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $target 'assets') -Force
}

Write-Host "==> Patching cordis.patch.yml: $patch"

# 2. add the plugin row (idempotent, always valid YAML)
$yaml = if (Test-Path $patch) { Get-Content $patch -Raw -Encoding UTF8 } else { "" }
if ($yaml -match 'cyrene-pet') {
    Write-Host "    already present, skipping patch."
} else {
    $entry = @'
- insert:
    - id: cyrene-pet
      name: '@yydscjy/dsh-cyrene-pet'

'@
    # A lone empty flow-array line ("[]") must be removed — appending after
    # it is invalid YAML (a flow sequence cannot be followed by more items).
    $yaml = $yaml -replace '(?m)^\[\s*\]\s*$', ''
    $yaml = $yaml.TrimEnd()
    $new = if ($yaml) { $yaml + "`n" + $entry } else { $entry }
    Set-Content -Path $patch -Value $new -Encoding UTF8 -NoNewline
    Write-Host "    patched."
}

Write-Host ""
Write-Host "==> Done. Restart dsh web for the plugin to load:"
Write-Host "    dsh web   (or restart the running dsh web process)"

