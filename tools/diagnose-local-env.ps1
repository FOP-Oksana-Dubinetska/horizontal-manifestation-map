$ErrorActionPreference = "Continue"

function Get-EnvValue {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return "<unset>"
  }

  return $Value
}

function Write-CommandVersion {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$VersionCommand
  )

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    Write-Host ("{0,-14} MISSING" -f $Name)
    return
  }

  try {
    $version = & $VersionCommand 2>&1 | Select-Object -First 1
    Write-Host ("{0,-14} {1}" -f $Name, $version)
    Write-Host ("{0,-14} {1}" -f "path", $command.Source)
  }
  catch {
    Write-Host ("{0,-14} FOUND, version probe failed: {1}" -f $Name, $_.Exception.Message)
    Write-Host ("{0,-14} {1}" -f "path", $command.Source)
  }
}

Write-Host "== workspace =="
Write-Host (Get-Location).Path
$gitCommand = Get-Command git.exe -ErrorAction SilentlyContinue
if ($gitCommand) {
  $gitRoot = git.exe rev-parse --show-toplevel 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "git-root: $gitRoot"
  }
  else {
    Write-Host "git-root: <not inside git repository>"
  }
}
else {
  Write-Host "git-root: <git unavailable>"
}

Write-Host ""
Write-Host "== Windows / MinGW-w64 environment =="
Write-Host "OS: $([System.Environment]::OSVersion.VersionString)"
Write-Host "PROCESSOR_ARCHITECTURE=$(Get-EnvValue $env:PROCESSOR_ARCHITECTURE)"

$gpp = Get-Command g++.exe -ErrorAction SilentlyContinue
if ($gpp) {
  Write-Host "MinGW bin: $([System.IO.Path]::GetDirectoryName($gpp.Source))"
}
else {
  Write-Host "MinGW bin: <g++.exe unavailable>"
}

Write-Host ""
Write-Host "== native toolchain =="
Write-CommandVersion "gcc.exe" { gcc.exe --version }
Write-CommandVersion "g++.exe" { g++.exe --version }
Write-CommandVersion "gdb.exe" { gdb.exe --version }
Write-CommandVersion "cmake.exe" { cmake.exe --version }
Write-CommandVersion "ninja.exe" { ninja.exe --version }
Write-CommandVersion "git.exe" { git.exe --version }

Write-Host ""
Write-Host "== Python =="
Write-CommandVersion "py.exe" { py.exe -3 --version }
Write-CommandVersion "python.exe" { python.exe --version }

Write-Host ""
Write-Host "== future web / wasm tools =="
Write-CommandVersion "node.exe" { node.exe --version }
Write-CommandVersion "npm.cmd" { npm.cmd --version }
Write-CommandVersion "emcc.bat" { emcc.bat --version }
Write-Host "EMSDK=$(Get-EnvValue $env:EMSDK)"

Write-Host ""
Write-Host "== stage-00 interpretation =="
$hasBlocker = $false
foreach ($required in @("g++.exe", "gdb.exe", "cmake.exe", "ninja.exe", "git.exe")) {
  if (-not (Get-Command $required -ErrorAction SilentlyContinue)) {
    Write-Host "BLOCKER: $required is unavailable in PATH."
    $hasBlocker = $true
  }
}
if (-not $hasBlocker) {
  Write-Host "READY: native MinGW-w64 build/debug prerequisites are available."
}
Write-Host "Emscripten is not required to begin stage 01; its required gate is stage 03."
