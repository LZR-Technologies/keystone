#!/bin/sh
# scan-secrets.sh - refuses a commit that would introduce an apparent secret.
#
# Why this exists: a hardcoded credential committed once lives in git history
# forever, even if a later commit removes it. The cheapest place to stop it is
# BEFORE the commit object is created, so this runs from .husky/pre-commit.
#
# Scope on purpose: it scans only what is STAGED (git diff --cached), not the
# whole tree, so it is fast and only judges what this commit actually adds.
#
# Honest limits (see CLAUDE.md B4): this matches KNOWN key SHAPES
# (AWS / Stripe / GitHub / OpenAI). A novel or encoded secret format can slip
# through, and `git commit --no-verify` bypasses it entirely. It is the fast
# local first line, not the unbypassable wall - server-side secret scanning in
# CI is the backstop.
#
# POSIX sh + grep -E only: must run on a bare developer machine with no extra
# tooling installed.

set -eu

# Only inspect files added/copied/modified in the index; deletions have no
# content to leak. -z + a NUL-delimited read keeps paths with spaces intact.
staged=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$staged" ]; then
  exit 0
fi

# Each pattern targets a provider's documented key shape. Kept deliberately
# tight (anchored prefixes, exact lengths where the format guarantees them) so
# ordinary code and prose do not trip a false positive:
# - AWS access key id: "AKIA" + 16 uppercase/digits.
# - Stripe secret/live/test key: sk_live_ or sk_test_ + 20+ chars.
# - GitHub token: ghp_ / gho_ / ghu_ / ghs_ / ghr_ + 36+ chars.
# - OpenAI key: sk- + 40+ chars (excludes Stripe's sk_ via the required dash).
patterns='(AKIA[0-9A-Z]{16})|(sk_(live|test)_[0-9a-zA-Z]{20,})|(gh[porus]_[0-9a-zA-Z]{36,})|(sk-[0-9a-zA-Z]{40,})'

found=0

# Scan the STAGED content (git show :file), not the working tree, so a secret
# staged but edited-out on disk is still caught - the commit is what matters.
# IFS/newline split is fine: git diff --name-only emits one path per line.
IFS='
'
for file in $staged; do
  # A staged blob can be binary; grep -I skips binary matches quietly.
  if git show ":$file" 2>/dev/null | grep -I -nE "$patterns" > /dev/null 2>&1; then
    if [ "$found" -eq 0 ]; then
      echo "BLOCKED: apparent secret(s) detected in staged changes." >&2
      echo "Secrets belong in the environment, never in the repo." >&2
      echo "" >&2
      found=1
    fi
    echo "  $file:" >&2
    # Show the offending lines so the author can find and remove them. The key
    # itself is already in their working tree, so echoing it reveals nothing new.
    git show ":$file" 2>/dev/null | grep -I -nE "$patterns" >&2 || true
  fi
done

if [ "$found" -ne 0 ]; then
  echo "" >&2
  echo "Move the value to an env var (see .env.example) and re-stage." >&2
  echo "If this is a false positive, review carefully; --no-verify bypasses" >&2
  echo "this check but the server-side scan in CI still runs." >&2
  exit 1
fi

exit 0
