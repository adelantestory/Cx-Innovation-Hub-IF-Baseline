# =============================================================================
# Branch Protection Guardrail — Hook Script (PowerShell)
# =============================================================================
# Ensures all agent work stays on the demo/performance-testing branch.
#
# Lifecycle events handled:
#   SessionStart — validates current branch on session init
#   PreToolUse   — blocks git commands that create branches, push to wrong
#                  branches, or rewrite history
#
# Input:  JSON via stdin (VS Code / Copilot hooks protocol)
# Output: JSON via stdout
# Exit:   0 = pass, 2 = block
# =============================================================================
param([string]$HookPhase)

$ALLOWED_BRANCH = "demo/performance-testing"
$RawInput = [Console]::In.ReadToEnd()

function Block-Action {
    param([string]$Reason)
    Write-Error "BLOCKED - $Reason"
    @{
        hookSpecificOutput = @{
            hookEventName = "PreToolUse"
            permissionDecision = "deny"
            permissionDecisionReason = $Reason
        }
    } | ConvertTo-Json -Compress
    exit 2
}

function Pass-Through {
    Write-Output '{}'
    exit 0
}

# Detect current branch
$CurrentBranch = git branch --show-current 2>$null
if (-not $CurrentBranch) { $CurrentBranch = "unknown" }

# ---------------------------------------------------------------------------
# SessionStart
# ---------------------------------------------------------------------------
if ($HookPhase -eq "session-start") {
    if ($CurrentBranch -ne $ALLOWED_BRANCH) {
        @{
            hookSpecificOutput = @{
                hookEventName = "SessionStart"
                additionalContext = "WARNING: Current branch is '$CurrentBranch'. All work must be on '$ALLOWED_BRANCH'. Run: git checkout $ALLOWED_BRANCH"
            }
        } | ConvertTo-Json -Compress
        exit 0
    }
    @{
        hookSpecificOutput = @{
            hookEventName = "SessionStart"
            additionalContext = "Branch verified: $ALLOWED_BRANCH"
        }
    } | ConvertTo-Json -Compress
    exit 0
}

# ---------------------------------------------------------------------------
# PreToolUse
# ---------------------------------------------------------------------------
if ($HookPhase -eq "pre-tool") {
    try {
        $ToolData = $RawInput | ConvertFrom-Json -ErrorAction Stop
    } catch {
        Pass-Through
    }

    $ToolName = $ToolData.tool_name
    $AllowedTools = @("run_in_terminal", "bash", "terminal", "shell", "execute_command")
    if ($ToolName -notin $AllowedTools) { Pass-Through }

    $Command = ""
    if ($ToolData.tool_input -and $ToolData.tool_input.command) {
        $Command = $ToolData.tool_input.command
    }
    if (-not $Command) { Pass-Through }

    # Rule 1: Block branch creation
    if ($Command -match 'git\s+(checkout\s+-b|switch\s+-c|branch\s+[^-])') {
        Block-Action "Branch creation is not allowed. All work must stay on '$ALLOWED_BRANCH'."
    }

    # Rule 2: Block pushes to wrong branches
    if ($Command -match 'git\s+push') {
        if ($Command -match 'git\s+push\s+\S+\s+(\S+)') {
            $PushTarget = $Matches[1]
            if ($PushTarget -and $PushTarget -ne $ALLOWED_BRANCH) {
                Block-Action "Push to '$PushTarget' is not allowed. Only '$ALLOWED_BRANCH' is permitted."
            }
        }
    }

    # Rule 3: Block force pushes and history rewrites
    if ($Command -match 'git\s+push\s+.*--force') {
        Block-Action "Force pushes are prohibited."
    }
    if ($Command -match 'git\s+reset\s+--hard') {
        Block-Action "Hard resets are prohibited. They rewrite history."
    }
    if ($Command -match 'git\s+rebase') {
        Block-Action "Rebase is prohibited. Use normal commits on '$ALLOWED_BRANCH'."
    }

    # Rule 4: Verify branch before commit
    if ($Command -match 'git\s+commit') {
        if ($CurrentBranch -ne $ALLOWED_BRANCH) {
            Block-Action "Commit rejected. You are on '$CurrentBranch', not '$ALLOWED_BRANCH'."
        }
    }

    Pass-Through
}

Pass-Through
