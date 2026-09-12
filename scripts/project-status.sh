#!/usr/bin/env bash

set -u

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    echo "Error: this command must be run inside the Aether Git repository."
    exit 1
}

cd "$REPO_ROOT" || exit 1

branch="$(git branch --show-current)"
last_commit="$(git log -1 --format='%h — %s')"
latest_tag="$(git describe --tags --abbrev=0 2>/dev/null || echo 'No tags')"
commits_since_tag="$(git rev-list "${latest_tag}..HEAD" --count 2>/dev/null || echo 'unknown')"
stash_count="$(git stash list | wc -l | tr -d ' ')"

if [ -z "$(git status --porcelain)" ]; then
    tree_status="Clean"
else
    tree_status="Changes present"
fi

printf '\n'
printf '============================================================\n'
printf ' AETHER PROJECT STATUS\n'
printf '============================================================\n'

printf '\nREPOSITORY\n'
printf '%-22s %s\n' "Root:" "$REPO_ROOT"
printf '%-22s %s\n' "Branch:" "$branch"
printf '%-22s %s\n' "Working tree:" "$tree_status"
printf '%-22s %s\n' "Latest tag:" "$latest_tag"
printf '%-22s %s\n' "Commits since tag:" "$commits_since_tag"
printf '%-22s %s\n' "Last commit:" "$last_commit"

printf '\nRECENT COMMITS\n'
git log --oneline --decorate -10

printf '\nBRANCH PROGRESS SINCE MAIN\n'
if git show-ref --verify --quiet refs/heads/main; then
    count="$(git rev-list --count main..HEAD)"
    printf '%s commits on %s but not main\n' "$count" "$branch"
    git log --oneline main..HEAD
else
    printf 'Local main branch not found.\n'
fi

printf '\nDOCUMENTATION\n'
for file in \
    docs/VISION.md \
    docs/ROADMAP.md \
    docs/ARCHITECTURE.md \
    docs/ENGINEERING.md \
    docs/DECISIONS.md \
    docs/CHANGELOG.md
do
    if [ ! -f "$file" ]; then
        printf '%-30s MISSING\n' "$file"
        continue
    fi

    lines="$(wc -l < "$file" | tr -d ' ')"

    if [ ! -s "$file" ]; then
        printf '%-30s EMPTY\n' "$file"
    else
        printf '%-30s %s lines\n' "$file" "$lines"
    fi
done

printf '\nSTASHES\n'
if [ "$stash_count" -eq 0 ]; then
    printf 'None\n'
else
    printf '%s stash(es)\n' "$stash_count"
    git stash list
fi

printf '\nUNCOMMITTED CHANGES\n'
if [ "$tree_status" = "Clean" ]; then
    printf 'None\n'
else
    git status --short
fi

printf '\n============================================================\n'
printf ' Repository facts only — review before planning new work.\n'
printf '============================================================\n\n'
