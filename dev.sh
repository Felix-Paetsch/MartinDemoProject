#!/bin/bash

SESSION="martin"
DIR="$HOME/work/Martin/dev"   # fixed directory

# check if the session already exists
tmux has-session -t "$SESSION" 2>/dev/null

if [ $? != 0 ]; then
  # create the session, starting in $DIR, detached (-d)
  tmux new-session -s "$SESSION" -c "$DIR" -d

  # first window runs neovim
  tmux send-keys -t "$SESSION":1 "nvim" C-m

  # create a second window with plain shell
  tmux new-window -t "$SESSION":2 -c "$DIR"
  tmux send-keys -t "$SESSION":2 "npm run dev" 
fi

# attach to the session
tmux attach -t "$SESSION"
