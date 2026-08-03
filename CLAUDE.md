# Working conventions for this repo

## Delivering fixes: always as a patch, with the apply command

This environment has no push access the user has authorized for direct commits — work is delivered as a
`git format-patch` file via SendUserFile, and the user applies it on their own machine.

**Every time a patch is delivered, always include the ready-to-run apply command in the same message —
never make the user ask for it.** Standard form (PowerShell, adjust the repo path if it changes):

```powershell
cd "E:\3rd June Final Deployment\cleancar-root"
git pull origin main
git am "$env:USERPROFILE\Downloads\<patch-filename>"
git push -u origin main
```

Notes learned from real sessions:
- The user's actual local clone lives at `E:\3rd June Final Deployment\cleancar-root` — not wherever
  their PowerShell prompt happens to be sitting. If unsure, this is confirmed from git history.
- Their Downloads folder is OneDrive-redirected, so `$env:USERPROFILE\Downloads` often does NOT resolve
  to where the browser actually saves files. If `git am` reports the patch file doesn't exist, use:
  ```powershell
  $patch = Get-ChildItem -Path (New-Object -ComObject Shell.Application).Namespace('shell:Downloads').Self.Path -Filter "<patch-filename-or-wildcard>"
  git am $patch.FullName
  ```
- Downloaded patch filenames sometimes get dashes stripped by the browser/OS (e.g.
  `0003-finance-cluster-fixes.patch` → `0003financeclusterfixes.patch`). Ask for the exact filename shown
  in File Explorer if a straightforward name guess fails.
- If `git am` fails with "Stray .git/rebase-apply directory found", run `git am --abort` first, then retry.
- After the user pushes, sync this session's local `main` to match `origin/main` (`git fetch` + diff-check
  content is identical + `git reset --hard origin/main`) — the locally-committed patch and the one the user
  applied via `git am` have different hashes (different commit metadata) but identical content, so this is
  always safe to do without a diff check first still being wise.

## Branch `claude/audit-report-review-lzffz3`

Leave this branch alone — do not touch, merge, rebase, or delete it. (Explicit user instruction.)

## Commit attribution

Local commits in this environment should use `git config user.email noreply@anthropic.com` and
`git config user.name Claude` (already set locally) so the stop-hook's unverified-commit check doesn't
fire on work that hasn't been pushed yet. It will still flag local commits as "Unverified" until the user
applies the patch and pushes from their own machine (which creates its own separately-signed/hashed
commit) — that's expected and not actionable from this session.
