---
name: github-sync
description: GLOBAL — use at the end of every task that touched tracked files, right after `definition-of-done`. Commits and pushes the work to GitHub so origin/main stays current after every prompt.
---

# GitHub sync

This repo pushes to `git@github.com:Egbemichel/pluggeo.git` (SSH remote,
`origin/main` already tracked — `git push` alone is enough, no `-u` needed).
Auth is a local SSH key (`~/.ssh/id_ed25519`) already registered on the
Egbemichel GitHub account; if a push ever fails with a permission/host-key
error, stop and surface it rather than trying to fix credentials yourself.

Run this after `definition-of-done` has already passed — this skill trusts
that gate and doesn't re-run tsc/lint/test itself.

## Steps

1. `git status --short`. Nothing changed → stop here, no empty commits, no
   pushes with nothing new.
2. Review what's listed before staging. Never blind `git add -A` if anything
   unfamiliar shows up (a stray file, something that looks like a secret) —
   investigate first, same as the project's standing Git Safety Protocol.
3. Stage the relevant files and commit. One commit per completed task/prompt,
   not per file. Message: what changed and why, 1-2 sentences, present in the
   body if it needs more than the subject line. Use a HEREDOC so multi-line
   messages don't get mangled:
   ```
   git commit -m "$(cat <<'EOF'
   Short summary of the change.

   Optional second paragraph with more context.
   EOF
   )"
   ```
4. **Never add a `Co-Authored-By` trailer or any other AI-attribution line to
   the commit message** — the user explicitly asked for commits without one.
   This is a hard rule, not a default to reconsider per-task.
5. `git push`. If it's rejected because the remote moved (e.g. someone edited
   a file directly on github.com), stop and tell the user — don't force-push
   to resolve it.

## Never

- `--force`/`--force-with-lease` to `main` without the user explicitly asking
  for it in that specific moment.
- `--no-verify`, `--no-gpg-sign`, or any other hook/check skip.
- Amending a commit that's already been pushed — new commit instead.
- Rewriting history (`rebase -i`, `filter-branch`, etc.).
- Committing anything under `.env*` (except `.env*.example` templates, which
  `.gitignore` already carves out) or any other secret, even if something
  else changed `.gitignore` to allow it — treat that as a stop-and-flag
  condition, not something to push through.
- Deleting branches or force-pushing over someone else's work.

## Scope

This automates the mechanics of routine commit/push per the user's standing
request (2026-08-28) so `origin/main` reflects finished work without being
asked each time. It does not by itself authorize any of the "Never" items
above — those still need the user's explicit in-the-moment go-ahead, exactly
as the project's normal safety rules already require.
