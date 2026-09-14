<#
.SYNOPSIS
	Builds the distributable .zip for the WordPress.org plugin directory.

.DESCRIPTION
	Windows-native equivalent of bin/build-zip.sh, for use without WSL,
	rsync, or zip. Every top-level entry listed in .distignore is
	excluded, so the archive carries only runtime files. The archive's
	top-level folder is always "simple-read-more", which is what
	WordPress uses as the install directory name.

.EXAMPLE
	powershell -ExecutionPolicy Bypass -File bin\build-zip.ps1
#>

$ErrorActionPreference = 'Stop'

$Slug     = 'simple-read-more'
$RootDir  = Split-Path -Parent $PSScriptRoot
$BuildDir = Join-Path $RootDir 'build'
$StageDir = Join-Path $BuildDir $Slug

# Read the version straight out of the plugin header so the filename
# can never drift from what is actually inside the archive.
$PluginFile   = Join-Path $RootDir "$Slug.php"
$VersionMatch = Select-String -Path $PluginFile -Pattern '^\s*\*\s*Version:\s*(.+)$' | Select-Object -First 1
if ($null -eq $VersionMatch) {
	throw "Could not read Version from $Slug.php"
}
$Version = $VersionMatch.Matches[0].Groups[1].Value.Trim()

$ReadmeFile = Join-Path $RootDir 'readme.txt'
$TagMatch   = Select-String -Path $ReadmeFile -Pattern '^Stable tag:\s*(.+)$' | Select-Object -First 1
if ($null -eq $TagMatch) {
	throw 'Could not read Stable tag from readme.txt'
}
$StableTag = $TagMatch.Matches[0].Groups[1].Value.Trim()

if ($Version -ne $StableTag) {
	throw "Plugin header Version ($Version) does not match readme.txt Stable tag ($StableTag). WordPress.org serves whatever Stable tag points at, so these must agree."
}

Write-Host "Building $Slug $Version"

if (Test-Path $BuildDir) { Remove-Item $BuildDir -Recurse -Force }
New-Item -ItemType Directory -Path $StageDir -Force | Out-Null

# Top-level names only, matching the anchored rsync rules in
# build-zip.sh so both scripts produce identical archives.
$Excludes = @('build') + (
	Get-Content (Join-Path $RootDir '.distignore') |
		Where-Object { $_.Trim() -ne '' -and -not $_.TrimStart().StartsWith('#') } |
		ForEach-Object { $_.Trim() }
)

Get-ChildItem -Path $RootDir -Force |
	Where-Object { $Excludes -notcontains $_.Name } |
	ForEach-Object { Copy-Item $_.FullName -Destination $StageDir -Recurse -Force }

# Safety net: these must never reach the directory, whatever the
# .distignore happens to say.
foreach ($forbidden in @('.git', 'node_modules', 'vendor')) {
	if (Test-Path (Join-Path $StageDir $forbidden)) {
		throw "$forbidden leaked into the build. Check .distignore."
	}
}

$ZipPath = Join-Path $BuildDir "$Slug-$Version.zip"
Compress-Archive -Path $StageDir -DestinationPath $ZipPath -Force

Write-Host "Created build\$Slug-$Version.zip"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
try {
	$archive.Entries | ForEach-Object { Write-Host ("  {0,8}  {1}" -f $_.Length, $_.FullName) }
} finally {
	$archive.Dispose()
}
