<#
Non-destructive environment check for this project.
- Reads `.env` to extract `DATABASE_URL`.
- Verifies Postgres service, `pg_hba.conf` presence, port listening.
- Attempts to connect with credentials found in `.env` (only if a password is present).
- Checks `package.json` scripts and `node`/`npm` availability and `node_modules` presence.

Usage: Run PowerShell as Administrator for full service/file checks, but script will still run without admin for some tests.
PS> .\scripts\check_environment.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "--- Nulip Project Environment Check ---" -ForegroundColor Cyan
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $root '..\.env' | Resolve-Path -ErrorAction SilentlyContinue
if (-not $envFile) { $envFile = Join-Path (Get-Location) '.env' }
$envFile = Resolve-Path $envFile -ErrorAction SilentlyContinue

# 1) .env and DATABASE_URL
if ($envFile -and (Test-Path $envFile)) {
    Write-Host "Found .env at: $envFile" -ForegroundColor Green
    $envText = Get-Content $envFile -Raw
    $dbLine = ($envText -split "\r?\n") | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
    if ($dbLine) {
        $dbVal = $dbLine -replace '^\s*DATABASE_URL\s*=\s*',''
        Write-Host "DATABASE_URL (raw): $dbVal"
        $m = [regex]::Match($dbVal, 'postgres(?:ql)?://(?<user>[^:]+):(?<pass>[^@]+)@(?<host>[^:/]+)(?::(?<port>\d+))?/(?<db>.+)')
        if ($m.Success) {
            $dbUser = $m.Groups['user'].Value
            $dbPass = $m.Groups['pass'].Value
            $dbHost = $m.Groups['host'].Value
            $dbPort = $m.Groups['port'].Value
            $dbName = $m.Groups['db'].Value
            if (-not $dbPort) { $dbPort = 5432 }
            Write-Host "Parsed DATABASE_URL:" -ForegroundColor Yellow
            Write-Host "  user: $dbUser"
            Write-Host "  password: " -NoNewline; Write-Host ('*' * ([Math]::Min(12, $dbPass.Length))) -ForegroundColor DarkGray
            Write-Host "  host: $dbHost"
            Write-Host "  port: $dbPort"
            Write-Host "  database: $dbName"
        } else {
            Write-Warning "Could not parse DATABASE_URL (not a standard postgresql://USER:PASSWORD@HOST:PORT/DB format)."
        }
    } else {
        Write-Warning "No DATABASE_URL line found in .env"
    }
} else {
    Write-Warning ".env not found in repository root or current directory."
}

# 2) Check for PostgreSQL service(s)
Write-Host "`nChecking PostgreSQL Windows services..." -ForegroundColor Cyan
$pgServices = Get-Service *postgres* -ErrorAction SilentlyContinue | Select-Object Name, Status, DisplayName
if ($pgServices) {
    $pgServices | Format-Table -AutoSize
} else {
    Write-Warning "No Windows services with 'postgres' in the name were found. Service checks skipped."
}

# 3) Locate pg_hba.conf under Program Files/PostgreSQL
Write-Host "`nLocating pg_hba.conf (Program Files/PostgreSQL)..." -ForegroundColor Cyan
$pgHba = Get-ChildItem 'C:\Program Files\PostgreSQL' -Filter pg_hba.conf -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
if ($pgHba) {
    Write-Host "Found pg_hba.conf: $pgHba" -ForegroundColor Green
    Write-Host "First 30 lines of pg_hba.conf:"
    Get-Content $pgHba -TotalCount 30 | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Warning "pg_hba.conf not found under C:\Program Files\PostgreSQL. If PostgreSQL is installed elsewhere, update the script or locate it manually."
}

# 4) Check port listening for PostgreSQL (from parsed port or default 5432)
$checkPort = $null
if ($dbPort) { $checkPort = $dbPort } else { $checkPort = 5432 }
Write-Host "`nChecking TCP listeners for port $checkPort..." -ForegroundColor Cyan
try {
    $net = netstat -ano | Select-String ":$checkPort\s"
    if ($net) {
        Write-Host "Lines matching port $checkPort (netstat -ano):" -ForegroundColor Green
        $net | ForEach-Object { Write-Host "  $_" }
    } else {
        Write-Warning "No listeners/processes found on port $checkPort. PostgreSQL may not be running or using a different port."
    }
} catch {
    Write-Warning "Failed to run netstat: $_"
}

# 5) Attempt to connect with credentials from .env (non-destructive).
if ($dbUser -and $dbPass -and $dbHost -and $dbName) {
    Write-Host "`nAttempting a read-only SQL connection using credentials from .env..." -ForegroundColor Cyan
    $orig = $env:PGPASSWORD
    try {
        $env:PGPASSWORD = $dbPass
        $psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
        if (-Not (Test-Path $psql)) {
            Write-Warning "psql not found at $psql. Attempting to run 'psql' from PATH if available."
            $psql = 'psql'
        }
        $cmd = "$psql -h $dbHost -p $checkPort -U $dbUser -d $dbName -c ""SELECT current_user, version();"""
        Write-Host "Running: $cmd" -ForegroundColor DarkGray
        $proc = Start-Process -FilePath $psql -ArgumentList "-h", $dbHost, "-p", $checkPort, "-U", $dbUser, "-d", $dbName, "-c", "SELECT current_user, version();" -NoNewWindow -Wait -PassThru -ErrorAction Stop
        if ($proc.ExitCode -eq 0) {
            Write-Host "psql connection succeeded (exit code 0)." -ForegroundColor Green
            # Check database existence using SQL
            Write-Host "Checking if database name exists from server(meta check)..."
            Start-Process -FilePath $psql -ArgumentList "-h", $dbHost, "-p", $checkPort, "-U", $dbUser, "-d", $dbName, "-c", "SELECT datname FROM pg_database WHERE datname = '$dbName';" -NoNewWindow -Wait -PassThru | Out-Null
        } else {
            Write-Warning "psql returned exit code $($proc.ExitCode)"
        }
    } catch {
        Write-Warning "psql connection attempt failed: $_"
    } finally {
        if ($null -ne $orig) { $env:PGPASSWORD = $orig } else { Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue }
    }
} else {
    Write-Warning "Insufficient DB credentials parsed from .env to attempt an automated psql connection."
}

# 6) Check node / npm and project deps
Write-Host "`nChecking Node.js and npm..." -ForegroundColor Cyan
try { Write-Host "node: $(node -v)" -ForegroundColor Green } catch { Write-Warning "node not found in PATH" }
try { Write-Host "npm: $(npm -v)" -ForegroundColor Green } catch { Write-Warning "npm not found in PATH" }

$packageJson = Join-Path (Resolve-Path (Join-Path $root '..') ) 'package.json'
if (Test-Path $packageJson) {
    Write-Host "Found package.json: $packageJson" -ForegroundColor Green
    $pkg = Get-Content $packageJson -Raw | ConvertFrom-Json
    if ($pkg.scripts) {
        Write-Host "package.json scripts:" -ForegroundColor Yellow
        $pkg.scripts.PSObject.Properties | ForEach-Object { Write-Host "  $($_.Name): $($_.Value)" }
        if ($pkg.scripts.'db:push') { Write-Host "Found script 'db:push'" -ForegroundColor Green }
        if ($pkg.scripts.dev) { Write-Host "Found script 'dev'" -ForegroundColor Green }
    } else { Write-Warning "No scripts node in package.json" }
} else {
    Write-Warning "package.json not found at expected location."
}

# Check node_modules (non-destructive)
$nodeMods = Join-Path (Join-Path (Resolve-Path (Join-Path $root '..')) 'node_modules')
if (Test-Path $nodeMods) {
    Write-Host "node_modules appears present: $nodeMods" -ForegroundColor Green
} else {
    Write-Warning "node_modules directory not found. Run 'npm install' to install dependencies."
}

Write-Host "`n--- Check complete. Review messages above for issues to address. ---" -ForegroundColor Cyan

# Exit with code 0 (script completed). Do not modify anything.
exit 0
