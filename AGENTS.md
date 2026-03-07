# Safe Edit Protocol
1. Analyze first
2. Produce a plan
3. Wait for approval before implementation
4. Verify with tests after changes

# Scope Rules
- Prefer minimal, surgical edits
- Do not refactor unrelated code
- If a task grows in scope, stop and report
- Preserve existing behavior unless explicitly asked to change it

# Testing Rules
- Update or add tests for changed behavior
- Report exact test commands run
- Summarize files changed

# Change Safety
- If more than 2 fixes are attempted for the same issue, stop and re-analyze
- Prefer adding tests before modifying complex behavior
- If system architecture is unclear, explain before editing

# Repository Verification
- Before analysis or edits, verify the repo root contains `package.json`, `src/`, `docs/`, and `src/**/__tests__` (or equivalent test directories)
- If not present, stop and report that the wrong repository may be in use
