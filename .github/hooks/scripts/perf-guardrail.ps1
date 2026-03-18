# =============================================================================
# Performance Test Guardrail — Hook Script (PowerShell)
# =============================================================================
# Enforces performance test coverage when API route files are modified.
#
# Lifecycle events handled:
#   PreToolUse  — when the agent edits a route file, checks coverage.
#   PostToolUse — after a route file edit, reports coverage status.
#
# Input:  JSON via stdin (VS Code / Copilot hooks protocol)
# Output: JSON via stdout
# Exit:   0 = pass, 2 = block
# =============================================================================
param([string]$HookPhase)

$LOCUSTFILE = "concept/tests/performance/locustfile.py"
$ROUTE_DIR  = "concept/apps/api/src/routes"
$RawInput   = [Console]::In.ReadToEnd()

function Block-Action {
    param([string]$Reason)
    Write-Error "BLOCKED - $Reason"
    @{
        hookSpecificOutput = @{
            hookEventName           = "PreToolUse"
            permissionDecision      = "deny"
            permissionDecisionReason = $Reason
        }
    } | ConvertTo-Json -Compress
    exit 2
}

function Pass-Through {
    Write-Output '{}'
    exit 0
}

function Inject-Context {
    param([string]$Ctx, [string]$Event = "PostToolUse")
    @{
        hookSpecificOutput = @{
            hookEventName    = $Event
            additionalContext = $Ctx
        }
    } | ConvertTo-Json -Compress
    exit 0
}

# ---------------------------------------------------------------------------
# Parse tool info
# ---------------------------------------------------------------------------
try {
    $ToolData = $RawInput | ConvertFrom-Json -ErrorAction Stop
} catch {
    Pass-Through
}

$ToolName = $ToolData.tool_name

# Determine target file
$TargetFile = ""
foreach ($key in @("filePath", "file_path", "path")) {
    if ($ToolData.tool_input -and $ToolData.tool_input.$key) {
        $TargetFile = $ToolData.tool_input.$key
        break
    }
}

# Normalize to workspace-relative
if ($TargetFile -match '(?:.*[/\\])?(concept/.*)') {
    $TargetFile = $Matches[1]
}

# Check if route file
$IsRouteFile = $TargetFile -match "^$($ROUTE_DIR -replace '\\','/')/.+\.js$"
if (-not $IsRouteFile) { Pass-Through }

$RouteBasename = [System.IO.Path]::GetFileNameWithoutExtension($TargetFile)

# ---------------------------------------------------------------------------
# Helper: check coverage for a file
# ---------------------------------------------------------------------------
function Get-CoverageReport {
    param([string]$FilePath)

    if (-not (Test-Path $FilePath)) { return @{ Covered = 0; Uncovered = 0; Details = "" } }
    if (-not (Test-Path $LOCUSTFILE)) { return @{ Covered = 0; Uncovered = 99; Details = "Locustfile missing" } }

    $Content = Get-Content $FilePath -Raw
    $LocustContent = Get-Content $LOCUSTFILE -Raw
    $Endpoints = [regex]::Matches($Content, 'router\.(get|post|put|patch|delete)\s*\(\s*"([^"]*)"')

    $Covered = 0; $Uncovered = 0; $Details = ""

    foreach ($m in $Endpoints) {
        $Method = $m.Groups[1].Value.ToUpper()
        $EpPath = $m.Groups[2].Value
        $MethodLower = $Method.ToLower()

        $SearchPath = ($EpPath -replace ':[a-zA-Z_]+', '[^/"]+') -replace '^/', ''

        $HasMatch = $false
        if ($LocustContent -match "self\.client\.$MethodLower" -and $LocustContent -match "/api/$SearchPath") {
            $HasMatch = $true
        }
        if ($LocustContent -match "name=`"$Method /api") {
            $HasMatch = $true
        }

        if ($HasMatch) {
            $Covered++
            $Details += " OK $Method /api$EpPath |"
        } else {
            $Uncovered++
            $Details += " MISSING $Method /api$EpPath |"
        }
    }

    return @{ Covered = $Covered; Uncovered = $Uncovered; Details = $Details }
}

# ---------------------------------------------------------------------------
# PreToolUse
# ---------------------------------------------------------------------------
if ($HookPhase -eq "pre-tool") {
    $EditTools = @("editFiles", "create_file", "replace_string_in_file", "multi_replace_string_in_file", "write", "edit")
    if ($ToolName -notin $EditTools) { Pass-Through }

    if (-not (Test-Path $LOCUSTFILE)) {
        Block-Action "Locustfile not found at $LOCUSTFILE. Performance test coverage is required before modifying API routes."
    }

    if (Test-Path $TargetFile) {
        $Report = Get-CoverageReport -FilePath $TargetFile
        if ($Report.Uncovered -gt 0) {
            @{
                hookSpecificOutput = @{
                    hookEventName      = "PreToolUse"
                    permissionDecision = "allow"
                    additionalContext  = "PERF WARNING: $($Report.Uncovered) uncovered endpoint(s) in $TargetFile. $($Report.Details) Add @task methods to $LOCUSTFILE."
                }
            } | ConvertTo-Json -Compress
            exit 0
        }
    }

    Pass-Through
}

# ---------------------------------------------------------------------------
# PostToolUse
# ---------------------------------------------------------------------------
if ($HookPhase -eq "post-tool") {
    if (-not (Test-Path $LOCUSTFILE)) {
        Inject-Context "WARNING: No locustfile at $LOCUSTFILE. Performance tests required for API route changes."
    }

    if (-not (Test-Path $TargetFile)) { Pass-Through }

    $Report = Get-CoverageReport -FilePath $TargetFile
    if ($Report.Uncovered -gt 0) {
        Inject-Context "PERF COVERAGE: $($Report.Covered) covered, $($Report.Uncovered) UNCOVERED in $TargetFile. $($Report.Details) Add @task methods before committing."
    } else {
        Inject-Context "PERF COVERAGE: All $($Report.Covered) endpoints in $TargetFile have Locust test coverage."
    }
}

Pass-Through
