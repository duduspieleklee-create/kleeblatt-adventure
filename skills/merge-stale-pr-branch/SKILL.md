---
name: "merge-stale-pr-branch"
description: "Merge a PR whose branch is behind main: diagnose conflicts, resolve with checkout --theirs, recover from stale gh pr merge errors."
---

# Merge a stale PR branch into main

Use when `gh pr merge` or `git merge origin/main` reports content conflicts and the
feature branch is behind main (its work may already be merged via another PR).
Proven on PRs #104/#105 where all conflicts were quote-style + main-only additions.

## Procedure
1. `gh pr checkout <n>` then `git fetch origin main -q && git merge origin/main`.
   Side semantics on the feature branch: `--ours` = feature branch (HEAD),
   `--theirs` = origin/main (the merged-in side).
2. Diagnose conflict nature BEFORE choosing a side, per conflicted file:
   - Is the branch's feature already in main?
     `git show origin/main:<file> | grep -c <feature-marker>` (e.g. FSM state
     names, function names). Count > 0 = main has it.
   - See real changes with quote-style noise stripped:
     `git diff HEAD origin/main -- <file> | grep -E '^[+-]' | grep -vE '^[+-]{3}' | grep -vE "'|\""`
   - Remaining output = main-only additions (new exports, new state fields) =
     safe to keep main's side wholesale.
3. If main already contains the branch's feature and diffs are formatting /
   main additions, take main's version:
   `git checkout --theirs <file1> <file2>`
   Verify: `grep -c '<<<<<<<' <files>` prints 0.
4. `git add -A && git commit -m "merge: resolve conflicts (keep main ...)"`
   then `git push origin <branch>`.
5. `gh pr merge <n> --squash --delete-branch`.

## Pitfalls
- Never `checkout --theirs` blindly. If the branch's unique feature is NOT in
  main (marker grep = 0), theirs deletes branch-only work; re-apply branch code
  onto main's version instead.
- `gh pr merge` can print "Run the following to resolve the merge conflicts
  locally: gh pr checkout ..." right after you pushed a resolution — the check
  is stale. Verify evenness with `git diff origin/main HEAD --stat` (empty =
  even), then retry the merge. Do not re-resolve.
- Conflicts may be pure quote-style (`'` vs `"`) from formatter drift; do not
  hand-edit hundreds of lines — take one side wholesale.

## Verification
- `grep -c '<<<<<<<' <files>` → 0 before commit.
- `git diff origin/main HEAD --stat` → empty after push.
- `gh pr merge` succeeds (output like "Updating <sha>..<sha> Fast-forward"),
  and `git log --oneline origin/main | head` shows the squash commit; the PR no
  longer appears in `gh pr list --state open`.
