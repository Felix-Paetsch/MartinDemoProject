#!/bin/bash

SESSION="martin"
DIR="$HOME/work/Martin"   # fixed directory

# check if the session already exists
tmux has-session -t "$SESSION" 2>/dev/null

if [ $? != 0 ]; then
  tmux new-session -s "$SESSION" -c "$DIR" -d
  tmux send-keys -t "$SESSION":1 "nvim" C-m

  tmux new-window -t "$SESSION":2 -c "$DIR/curves"
  tmux send-keys -t "$SESSION":2 "npm run browser1" C-m
  
  tmux new-window -t "$SESSION":3 -c "$DIR/curves"
  tmux send-keys -t "$SESSION":3 "npm run browser2" C-m
  
  tmux new-window -t "$SESSION":4 -c "$DIR/curves"
  tmux send-keys -t "$SESSION":4 "npm run browser3" C-m
  
  tmux new-window -t "$SESSION":5 -c "$DIR/curves"
  tmux send-keys -t "$SESSION":5 "npm run node"
fi

# attach to the session
tmux attach -t "$SESSION"
