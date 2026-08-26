---
name: create-pr
description: Create a pull request for SistemaVivox following this repo's fork-based workflow, branch naming, and PR body conventions. Use when the user asks to open/create a PR, ship a feature, or says "crie uma PR" / "abre um PR".
user-invocable: true
---

# SistemaVivox — Create Pull Request

This repo uses a **fork-based** workflow, not a direct-push-to-org one. Two remotes exist:

- **`kelson`** → `https://github.com/kelson-cosme/sistemaVivox.git` — the personal fork. Local `main` tracks `kelson/main`. Feature branches get pushed here.
- **`origin`** → `https://github.com/VIVOX-Workstation/sistemaVivox.git` — the org's upstream repo. PRs are opened **against this repo's `main` branch**, with the head being `kelson-cosme:<branch>`.

Always confirm this pair with `git remote -v` before assuming it hasn't changed.

## Steps

1. **Check GitHub auth first.** Run `gh auth status`. If not authenticated, **stop** — do not attempt to script a login. Tell the user to run `gh auth login` themselves (in Claude Code, they can type `! gh auth login` to run it interactively in-session).

2. **Survey the change.** Run `git status` and `git diff` (staged + unstaged) to see everything in flight. This repo's `.gitignore` already excludes `.env*`, `*credentials*.json`, `node_modules/`, `dist/`, `build/`, `.maestri/`, and loose root/`backend/*.js` test scripts — but still eyeball untracked files for anything that slipped through (stray secrets, ad-hoc scripts) before staging.

3. **Branch naming** — prefix by conventional-commit type, kebab-case, descriptive: `feat/vivox-educacional`, `fix/capa-drag-picker`, `chore/...`, `docs/...`. Create off an up-to-date `main`: `git checkout -b <name>`.

4. **Commit style** — matches existing history: `type(scope): description`, type in English (`feat`, `fix`, `chore`, `docs`, `refactor`), scope is the lowercase module/folder touched (`clientes`, `penpot`, `cursos`...), description can be in Portuguese or English (this repo mixes both freely). Group unrelated changes into separate commits when it's clean to do so; don't force one giant commit if the diff naturally splits (e.g. a schema/migration commit separate from the feature commit).

5. **Push to the fork**: `git push -u kelson <branch>`.

6. **Open the PR against the org repo, from the fork**:
   ```
   gh pr create --repo VIVOX-Workstation/sistemaVivox --base main --head kelson-cosme:<branch> --title "type(scope): short title" --body "$(cat <<'EOF'
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

## Guardrails

- Only commit, push, or open a PR when the user has explicitly asked for it in this turn — never proactively bundle unrelated in-flight work into a PR without asking.
- Never `--force` push, never skip hooks (`--no-verify`), never rewrite already-pushed history unless the user explicitly asks.
- If `main` has diverged from `kelson/main` (someone else pushed), rebase or merge before pushing — don't force-overwrite.
