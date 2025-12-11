#!/bin/bash

SESSION="martin_logging"
DIR="$HOME/work/Martin"   # fixed directory

# check if the session already exists
tmux has-session -t "$SESSION" 2>/dev/null

if [ $? != 0 ]; then
  tmux new-session -s "$SESSION" -c "$DIR/curves" -d
  tmux send-keys -t "$SESSION":1 "npm run logging" C-m

  tmux new-window -t "$SESSION":2 -c "$DIR/curves"
  tmux send-keys -t "$SESSION":2 "npm run typecheck_watch" C-m
  
  tmux new-window -t "$SESSION":3 -c "$DIR/lib"
  tmux send-keys -t "$SESSION":3 "npm run typecheck_watch" C-m
fi

# attach to the session
tmux attach -t "$SESSION"
