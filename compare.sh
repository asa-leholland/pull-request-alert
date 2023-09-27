#!/bin/bash

# Specify the target branch
target_branch="main"

# Get the name of the current branch
current_branch=$(git symbolic-ref --short HEAD)

# Automatically stage all uncommitted files
git add . 2>/dev/null

# Get the total insertions and deletions from the last lines of `git diff --shortstat` for committed differences
committed_shortstat_output=$(git diff --shortstat "$target_branch" 2>/dev/null)
committed_insertions=$(echo "$committed_shortstat_output" | tail -n 1 | awk '{print $4}')
committed_deletions=$(echo "$committed_shortstat_output" | tail -n 1 | awk '{print $6}')

# Get the total insertions and deletions for staged (but uncommitted) changes
staged_shortstat_output=$(git diff --cached --shortstat 2>/dev/null)
staged_insertions=$(echo "$staged_shortstat_output" | tail -n 1 | awk '{print $4}')
staged_deletions=$(echo "$staged_shortstat_output" | tail -n 1 | awk '{print $6}')

# Calculate the total insertions and deletions by summing committed, staged, and unstaged changes
total_insertions=$((committed_insertions + staged_insertions))
total_deletions=$((committed_deletions + staged_deletions))

# Print the result in the desired format
if ((total_insertions + total_deletions > 0)); then
  printf "𝜟=%d (+%d/-%d)\n" "$((total_insertions + total_deletions))" "$total_insertions" "$total_deletions"
else
  printf "𝜟=0 (+0/-0)\n"
fi
