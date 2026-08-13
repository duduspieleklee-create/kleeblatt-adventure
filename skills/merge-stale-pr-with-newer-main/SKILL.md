---
name: "merge-stale-pr-with-newer-main"
description: "Merge a stale PR branch conflicting with newer origin/main: git checkout --theirs, verify no markers, retry gh pr merge on stale conflict message."
---

# Merge stale PR branch conflicting with newer main

Use when merging a PR whose branch fell behind origin/main and `git merge origin/main` reports conflicts, or `gh pr merge` says "resolve the merge conflicts locally". Works when origin/main already contains the branch's feature plus newer additions, so the branch's own work must not be dropped.

## Procedure
1. Checkout the PR branch: `gh pr checkout <n>`.
2. Fetch and merge main: `git fetch origin main -q && git merge origin/main`. Conflicts expected if branch is stale.
3. Locate all conflict regions: `grep -n "<<<<<<<\\|>>>>>>>" <files> | head`.
4. Decide direction before resolving. Keep origin/main's version only if the branch's feature already exists there or differences are purely stylistic. Semantic check: `git show origin/main:<file> | grep -c "<branch-feature-token>"` (nonzero = feature already in main); `git diff HEAD origin/main -- <file> | grep -E "^[+-]" | grep -vE "^[+-]{3}" | grep -vE "['\"]" | head` shows real (non-quote) differences.
5. Take main's version wholesale — during a merge in progress, `--theirs` is the merged-in branch (origin/main), `--ours` is HEAD: `git checkout --theirs <file1> <file2> ...`. Verify: `grep -c "<<<<<<<" <files>` must print 0.
6. Commit and push: `git add -A && git commit -m "merge: resolve conflicts (keep main ...)" && git push origin <branch>`.
7. Merge: `gh pr merge <n> --squash --delete-branch`.

## Pitfalls
- `gh pr merge` may print "Run the following to resolve the merge conflicts locally" even after the branch is already even with main — this is a stale merge-base message, not a real conflict. Check `git diff origin/main HEAD --stat`; if empty, just retry `gh pr merge` (it then fast-forwards).
- `git checkout --theirs` replaces the whole file with the other side. Never use it when the branch has unique feature code absent from main — you would silently drop it. Verify with step 4 first.
- Conflicts that are only quote-style (`'` vs `"`) plus comment blocks still block git auto-merge; they are not a reason to hand-edit hunks.

## Verification
`gh pr list --state open` no longer shows the PR; `git log --oneline -6 origin/main` shows the squash-merge commit; `gh run list --branch main --limit 3` shows the merge-push CI run. A clean confirmation is `git diff origin/main HEAD --stat` printing nothing before the merge succeeds.
