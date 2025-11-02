#!/bin/bash

SESSION="martinS"
DIR="$HOME/work/Martin/dev"   # fixed directory

# check if the session already exists
tmux has-session -t "$SESSION" 2>/dev/null

if [ $? != 0 ]; then
  # create the session, starting in $DIR, detached (-d)
  tmux new-session -s "$SESSION" -c "$DIR" -d

  # first window runs neovim
  tmux send-keys -t "$SESSION":1 "nvim"

  tmux new-window -t "$SESSION":2 -c "$DIR"
  tmux send-keys -t "$SESSION":2 "npm run dev:kernel"  C-m
  
  tmux new-window -t "$SESSION":3 -c "$DIR"
  tmux send-keys -t "$SESSION":3 "npm run dev:plugin:lib"  C-m

  tmux new-window -t "$SESSION":4 -c "$DIR"
  tmux send-keys -t "$SESSION":4 "npm run dev:plugin:iframe"  C-m
 
  tmux new-window -t "$SESSION":5 -c "$DIR"
  tmux send-keys -t "$SESSION":5 "npm run dev:external"  C-m

fi

# attach to the session
tmux attach -t "$SESSION"
