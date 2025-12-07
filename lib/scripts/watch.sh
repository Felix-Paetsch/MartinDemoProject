set -uo pipefail
#!/usr/bin/env bash

# ----------------------------------------
# USAGE
# ----------------------------------------
# ./scripts/watch-and-build.sh "<npm_command>" [delay_seconds]
#
# Example:
#   ./scripts/watch-and-build.sh "npm run build:watch" 1
#   ./scripts/watch-and-build.sh "npm run lint" 2
#
# Default delay: 1 second
# ----------------------------------------

if [ $# -lt 1 ]; then
  echo "Usage: $0 \"<npm_command>\" [delay_seconds]"
  exit 1
fi

CMD="$1"
DELAY="${2:-1}"              # default 1s
WATCH_DIR="./src"
PROJECT_ROOT="$(dirname "$(dirname "$0")")"  # go up one level from ./scripts/
cd "$PROJECT_ROOT"

last_run=0
queued=false

run_build() {
  local now
  now=$(date +%s)
  local elapsed=$(( now - last_run ))

  if (( elapsed < DELAY )); then
    if ! $queued; then
      queued=true
      # defer the next run until delay expires
      sleep $(( DELAY - elapsed ))
      queued=false
      run_build
    else
      # already queued → ignore
      return
    fi
  else
    echo "🔁 Change detected → running: $CMD"
    eval "$CMD"
    last_run=$(date +%s)
  fi
}

# Check tool availability
if ! command -v inotifywait >/dev/null 2>&1; then
  echo "Error: inotifywait is not installed."
  echo "Install it with: sudo pacman -S inotify-tools"
  exit 1
fi

echo "📡 Watching '$WATCH_DIR' (debounce: ${DELAY}s) → running \"$CMD\" on change."

run_build

inotifywait -m -r -e modify,create,delete,move "$WATCH_DIR" --format '%w%f' |
while read -r changed_file; do
  case "$changed_file" in
    *.ts|*.js|*.json|*.tsx|*.jsx)
      run_build
      ;;
  esac
done
