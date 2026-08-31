---
name: create-pr
description: Create a pull request for SistemaVivox following this repo's remote setup, branch naming, and PR body conventions. Use when the user asks to open/create a PR, ship a feature, or says "crie uma PR" / "abre um PR".
user-invocable: true
---

# SistemaVivox — Create Pull Request

Two remotes exist, and this is **not** a fork-based workflow — verified 2026-08-25 that `kelson-cosme/sistemaVivox` is a plain independent repo on GitHub (`fork: false`, no `parent`/`source`), not an actual GitHub fork of the org repo. Cross-repo PRs between two unrelated repos fail (`No commits between ...`, `not all refs are readable`), so don't attempt one — each repo gets its own separate PR instead (see step 6b).

- **`origin`** → `https://github.com/VIVOX-Workstation/sistemaVivox.git` — the team-visibility repo. The user (`kelson-cosme`) has **admin** access here directly (confirmed via `gh api repos/VIVOX-Workstation/sistemaVivox --jq .permissions`). This is where the team reviews and merges PRs. Push feature branches and open PRs **within this repo** (`base: main`, `head: <branch>`, no `owner:` prefix needed).
- **`kelson`** → `https://github.com/kelson-cosme/sistemaVivox.git` — a separate personal repo. **This is what actually matters for production**: confirmed via a Coolify deployment log (2026-08-26) that the Coolify app clones from `kelson-cosme/sistemaVivox:main` — merging into `origin`'s `main` does **not** trigger a deploy by itself. The two repos are NOT kept in sync automatically; `kelson-cosme/sistemaVivox` has its own independent commit/PR history (it even has its own PR #1, separate from `origin`'s PR #1, both merging the same feature at different times).

Always confirm remotes with `git remote -v` and re-verify the permissions check above if either repo's setup might have changed.

## Steps

1. **Check GitHub auth first.** Run `gh auth status`. If not authenticated, **stop** — do not attempt to script a login. Tell the user to run `gh auth login` themselves (in Claude Code, they can type `! gh auth login` to run it interactively in-session).

2. **Survey the change.** Run `git status` and `git diff` (staged + unstaged) to see everything in flight. This repo's `.gitignore` already excludes `.env*`, `*credentials*.json`, `node_modules/`, `dist/`, `build/`, `.maestri/`, and loose root/`backend/*.js` test scripts — but still eyeball untracked files for anything that slipped through (stray secrets, ad-hoc scripts) before staging.

3. **Branch naming** — prefix by conventional-commit type, kebab-case, descriptive: `feat/vivox-educacional`, `fix/capa-drag-picker`, `chore/...`, `docs/...`. Create off an up-to-date `main`: `git checkout -b <name>`.

4. **Commit style** — matches existing history: `type(scope): description`, type in English (`feat`, `fix`, `chore`, `docs`, `refactor`), scope is the lowercase module/folder touched (`clientes`, `penpot`, `cursos`...), description can be in Portuguese or English (this repo mixes both freely). Group unrelated changes into separate commits when it's clean to do so; don't force one giant commit if the diff naturally splits (e.g. a schema/migration commit separate from the feature commit).

5. **Push to origin (the org repo)**: `git push -u origin <branch>`.

6. **Open the PR within the org repo (same-repo, no owner prefix on `--head`)**:
   ```
   gh pr create --repo VIVOX-Workstation/sistemaVivox --base main --head <branch> --title "type(scope): short title" --body "$(cat <<'EOF'
   ## Summary
   - <what changed and why, 1-3 bullets>

   ## Test plan
   - [ ] <what was verified — e.g. `npm run build` exit 0, backend route confirmed live via docker logs, manual browser test>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```
   Keep the title under ~70 chars; put detail in the body, not the title.

7. **Report back** the PR URL from the `gh pr create` output.

6b. **Replicate to `kelson` once the `origin` PR is merged** — this is the step that actually reaches production, per the user's explicit decision (2026-08-26): after the team-visibility PR merges in `origin`, push the same branch to `kelson` too (`git push kelson <branch>`) and open a second PR there (`gh pr create --repo kelson-cosme/sistemaVivox --base main --head <branch> --title "..." --body "..."`, same title/body convention). Don't skip this — merging only in `origin` silently leaves production on the old code. The user merges this second PR themselves to trigger the Coolify deploy. Do not assume this step happened automatically; check `gh pr view <n> --repo kelson-cosme/sistemaVivox --json state,mergedAt` if unsure whether a given change ever reached the deploy-triggering repo.

## Guardrails

- Only commit, push, or open a PR when the user has explicitly asked for it in this turn — never proactively bundle unrelated in-flight work into a PR without asking.
- Never `--force` push, never skip hooks (`--no-verify`), never rewrite already-pushed history unless the user explicitly asks.
- If `main` has diverged from `origin/main` (someone else pushed), rebase or merge before pushing — don't force-overwrite.
