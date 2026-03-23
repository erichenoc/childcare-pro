#!/bin/bash
# PostToolUse hook: TypeScript validation after file edits
# Only runs on .ts/.tsx file edits to catch type errors early
# Non-blocking: logs errors but doesn't prevent Claude from continuing

# Get the tool name and file path from environment
TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
FILE_PATH="${CLAUDE_FILE_PATH:-}"

# Only run on Edit/Write tools for TypeScript files
if [[ "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "Write" ]]; then
  echo "{}"
  exit 0
fi

if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]]; then
  echo "{}"
  exit 0
fi

# Check if tsconfig exists (we're in a TypeScript project)
if [ ! -f "tsconfig.json" ]; then
  echo "{}"
  exit 0
fi

# Run typecheck on the specific file (fast, ~2-3 seconds)
# Use --noEmit to only check types without generating output
RESULT=$(npx tsc --noEmit --pretty false 2>&1 | head -20)

if [ $? -ne 0 ]; then
  # Log the error but don't block
  mkdir -p .claude/logs
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] TypeScript errors after editing $FILE_PATH:" >> .claude/logs/typecheck.log
  echo "$RESULT" >> .claude/logs/typecheck.log
  echo "---" >> .claude/logs/typecheck.log
fi

# Always return success to not block the tool
echo "{}"
