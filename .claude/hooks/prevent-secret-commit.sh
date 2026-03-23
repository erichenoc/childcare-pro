#!/bin/bash
# PreToolUse hook: Prevents committing files that may contain secrets
# Blocks git add/commit of .env files and files with hardcoded secrets

TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
COMMAND="${CLAUDE_COMMAND:-}"

# Only check Bash commands
if [ "$TOOL_NAME" != "Bash" ]; then
  echo "{}"
  exit 0
fi

# Block git add of .env files
if echo "$COMMAND" | grep -qE "git add.*\.env"; then
  echo '{"error": "BLOCKED: Cannot commit .env files. They contain secrets and should stay in .gitignore."}'
  exit 2
fi

# Block git add -A or git add . (too broad, might include secrets)
if echo "$COMMAND" | grep -qE "git add (-A|\.)$"; then
  echo '{"warning": "Using git add -A or git add . can accidentally include sensitive files. Consider adding specific files instead."}'
  # Don't block, just warn
  echo "{}"
  exit 0
fi

echo "{}"
