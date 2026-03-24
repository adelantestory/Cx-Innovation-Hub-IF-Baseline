# =============================================================================
# Load Test Coverage Check — SessionStart Hook Script (PowerShell)
# =============================================================================
# Calculates Locust performance test coverage against API endpoints.
# If coverage is below the threshold, shows a warning to the developer.
#
# Pattern: exit 0 with JSON stdout. Uses systemMessage for visible warnings.
# =============================================================================

$THRESHOLD = 90
$API_DIR = "concept/apps/api/src"
$TEST_DIR = "concept/tests/performance/scenarios"

# Read and discard stdin (hook sends common fields we don't need)
try { [Console]::In.ReadToEnd() | Out-Null } catch {}

# ---------------------------------------------------------------------------
# Step 1: Discover API endpoints from route files
# ---------------------------------------------------------------------------
$endpoints = @()

$indexPath = "$API_DIR/index.js"
if (-not (Test-Path $indexPath)) { exit 0 }

$indexContent = Get-Content $indexPath -Raw

# Build map: variable name → route file path
$routeMap = @{}
$requireMatches = [regex]::Matches($indexContent, 'const\s+(\w+)\s*=\s*require\("\.\/routes\/([^"]+)"\)')
foreach ($m in $requireMatches) {
    $varName = $m.Groups[1].Value
    $fileName = $m.Groups[2].Value
    if ($fileName -notmatch '\.js$') { $fileName = "$fileName.js" }
    $routeMap[$varName] = "$API_DIR/routes/$fileName"
}

# Build map: variable name → mount path
$mountMap = @{}
$mountMatches = [regex]::Matches($indexContent, 'app\.use\("([^"]+)"\s*,\s*(\w+)\)')
foreach ($m in $mountMatches) {
    $mountPath = $m.Groups[1].Value
    $varName = $m.Groups[2].Value
    $mountMap[$varName] = $mountPath
}

# Inline routes (e.g., app.get("/api/health", ...))
$inlineMatches = [regex]::Matches($indexContent, 'app\.(get|post|put|patch|delete)\("([^"]+)"')
foreach ($m in $inlineMatches) {
    $method = $m.Groups[1].Value.ToUpper()
    $path = $m.Groups[2].Value
    $endpoints += "$method $path"
}

# Parse each route file
foreach ($varName in $routeMap.Keys) {
    $filePath = $routeMap[$varName]
    if (-not (Test-Path $filePath)) { continue }

    $mountPath = ""
    if ($mountMap.ContainsKey($varName)) { $mountPath = $mountMap[$varName] }

    $routeContent = Get-Content $filePath -Raw
    $routeMatches = [regex]::Matches($routeContent, 'router\.(get|post|put|patch|delete)\("([^"]+)"')
    foreach ($m in $routeMatches) {
        $method = $m.Groups[1].Value.ToUpper()
        $subPath = $m.Groups[2].Value
        if ($subPath -eq "/") {
            $fullPath = $mountPath
        } else {
            $fullPath = $mountPath + $subPath
        }
        $endpoints += "$method $fullPath"
    }
}

# ---------------------------------------------------------------------------
# Step 2: Discover tested endpoints from Locust test files
# ---------------------------------------------------------------------------
$testedEndpoints = @()

$testFiles = Get-ChildItem "$TEST_DIR/test_*.py" -ErrorAction SilentlyContinue
foreach ($testFile in $testFiles) {
    $testContent = Get-Content $testFile.FullName -Raw
    $nameMatches = [regex]::Matches($testContent, 'name\s*=\s*"(?:\[.*?\]\s*)?(GET|POST|PUT|PATCH|DELETE)\s+(/api/[^"]+)"')
    foreach ($m in $nameMatches) {
        $method = $m.Groups[1].Value
        $path = $m.Groups[2].Value
        $testedEndpoints += "$method $path"
    }
}

# ---------------------------------------------------------------------------
# Step 3: Normalize and compare
# ---------------------------------------------------------------------------
$normalizedEndpoints = @($endpoints | ForEach-Object { [regex]::Replace($_, ':[a-zA-Z_]+', ':param') } | Sort-Object -Unique)
$normalizedTested = @($testedEndpoints | ForEach-Object { [regex]::Replace($_, ':[a-zA-Z_]+', ':param') } | Sort-Object -Unique)

$totalCount = $normalizedEndpoints.Count
if ($totalCount -eq 0) { exit 0 }

$coveredCount = 0
$missingEndpoints = @()

foreach ($ep in $normalizedEndpoints) {
    if ($normalizedTested -contains $ep) {
        $coveredCount++
    } else {
        # Find the original (non-normalized) version for display
        $originalEp = $ep
        foreach ($orig in $endpoints) {
            if (([regex]::Replace($orig, ':[a-zA-Z_]+', ':param')) -eq $ep) {
                $originalEp = $orig
                break
            }
        }
        $missingEndpoints += $originalEp
    }
}

$coveragePct = [math]::Round(($coveredCount / $totalCount) * 100, 1)

# ---------------------------------------------------------------------------
# Step 4: Output JSON result
# ---------------------------------------------------------------------------
if ($coveragePct -ge $THRESHOLD) {
    @{
        hookSpecificOutput = @{
            hookEventName    = "SessionStart"
            additionalContext = "Load test coverage: $coveredCount/$totalCount endpoints (${coveragePct}%) - meets ${THRESHOLD}% threshold."
        }
    } | ConvertTo-Json -Depth 5 | Write-Output
    exit 0
}

# Below threshold — warn the developer
$missingList = ($missingEndpoints | ForEach-Object { "  - $_" }) -join "`n"

$warningMsg = @"
LOAD TEST COVERAGE: ${coveragePct}% (${coveredCount}/${totalCount} endpoints) - below ${THRESHOLD}% threshold.

Missing load tests for:
$missingList

Run /locust-performance-testing to add the missing test scenarios.
"@

$modelContext = @"
Load test coverage is ${coveragePct}% (${coveredCount}/${totalCount} API endpoints covered). Threshold: ${THRESHOLD}%. Missing endpoints:
$missingList
The locust-performance-testing skill (/locust-performance-testing) can create new Locust test scenarios. Test files go in concept/tests/performance/scenarios/test_*.py. Remind the developer about the missing coverage and offer to help create the missing test scenarios.
"@

@{
    systemMessage      = $warningMsg
    hookSpecificOutput = @{
        hookEventName    = "SessionStart"
        additionalContext = $modelContext
    }
} | ConvertTo-Json -Depth 5 | Write-Output
exit 0
