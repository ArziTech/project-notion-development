---
name: implement-notion-task
description: >
  Implement a Notion task from the project defined in PROJECT-NOTION.md.
  Use this skill whenever the user says "implement task X", "build task X",
  "code task X", or "work on task X" where X is a task from the Notion
  workspace. This skill coordinates code-writer agent(s) to implement the
  code (potentially multiple in parallel for large tasks), optionally
  verifies via tester agent (only if Test sub-task exists), asks before
  committing, then marks the task Done in Notion. Use when the user wants
  to go from a planned Notion task to working code.
compatibility: Notion MCP tools + Agent tool + Bash git commands
prerequisite: PROJECT-NOTION.md must exist in project root
---

# Implement Notion Task

This skill takes a Notion task, coordinates its implementation via one or more
**code-writer agents** (fresh contexts, optionally in parallel), optionally
verifies via **tester agent** (only if Test sub-task exists), asks for commit
confirmation, then marks it Done in Notion.

## When to Use

- User wants to implement a planned Notion task
- Task has implementation plan with acceptance criteria
- Task status is "Planning" or "Not started"

## Prerequisite Check

**MANDATORY — do this first.**

Before starting, verify `PROJECT-NOTION.md` exists:

```bash
PROJECT_NOTION_PATH="./PROJECT-NOTION.md"
if [ ! -f "$PROJECT_NOTION_PATH" ]; then
  echo "ERROR: PROJECT-NOTION.md not found. Run 'init-project-notion' skill first."
  echo "Aborting implement-notion-task."
  exit 1
fi
```

---

## Dynamic Notion IDs

IDs are read from `PROJECT-NOTION.md` at runtime. Do NOT hardcode IDs.

### ID Extraction Functions

```bash
PROJECT_NOTION_PATH="./PROJECT-NOTION.md"

# Get project ID
get_notion_project_id() {
  grep -A1 "^notion-project-id:" "$PROJECT_NOTION_PATH" | grep -v "notion-project-id:" | tr -d ' ' | cut -d= -f2
}

# Get current milestone ID
get_current_milestone_id() {
  grep -A1 "^current-milestone:" "$PROJECT_NOTION_PATH" | grep -v "current-milestone:" | tr -d ' ' | cut -d= -f2
}

# Get Tasks database data source
get_tasks_database() {
  grep "^tasks-database" "$PROJECT_NOTION_PATH" | cut -d: -f2 | tr -d ' '
}
```

---

## 4-Phase Workflow

### Phase 1: Fetch task plan and check for conflicts

#### Step 1a: Identify the task

The user provides a task name or URL.

**If URL provided**: Extract the page ID and use `notion-fetch` directly.

**If name provided**: Search for it:

```
notion-search
  query: "[task name]"
  query_type: internal
  page_size: 5
```

Pick the first result that matches — verify it has the project
in its ancestor path or Projects property.

#### Step 1b: Fetch the task

Use `notion-fetch` on the page ID to get:
- **Name** — task title
- **Description** — brief plan (from properties)
- **Page content** — detailed implementation plan + acceptance criteria
- **Status** — current status (verify it's not already Done)
- **Sub-item** — relation to Test sub-task page (if any)

Extract from both:
1. `properties.Description` — brief plan/overview
2. Page content text — detailed steps, files, commands, acceptance criteria

If the task has no Description and no content, ask the user:
> "This task has no plan yet. Would you like me to plan it first using
> the plan-notion-task skill?"

#### Step 1c: Check for file conflicts

**MANDATORY — check if any other task is modifying the same files.**

Before proceeding, search for other tasks in these statuses that might modify overlapping files:
- `In progress`
- `Waiting for Testing`
- `Waiting for Review`

Extract "Files to Change" from the task content. Then inform the user:

```
## Conflict Check

**Checking for concurrent tasks that may modify the same files...**

Files in this task:
- [file1]
- [file2]

**Note:** If other tasks are implementing the same files concurrently,
there may be merge conflicts. Proceed with caution.
```

If files overlap with another active task, warn the user:
> "Warning: Other tasks are modifying some of the same files. Consider
> waiting for those tasks to complete, or coordinate to avoid conflicts."

#### Step 1d: Extract key info

Parse the page content and extract:
- **Task name**: from properties.Name
- **Plan text**: full page content or Description field
- **Files to Change**: list from "Files to Change" section
- **Acceptance criteria**: list from "Acceptance Criteria" section
- **Pages to verify**: list of dashboard paths from UAT table (in Test page if exists)
- **Test sub-task exists**: yes/no (from Sub-item property)

#### Step 1e: Decide how many code-writers to launch

Assess the task scope:

| Size | Steps | Code-writers |
|------|-------|--------------|
| Small | 1-3 | 1 |
| Medium | 4-7 | 1-2 |
| Large | 8+ | 2+ (parallel) |

- **Small/medium task**: Launch **1 code-writer agent** with the full plan
- **Large task**: Ask user if they want parallel code-writers

```
> "This task is large. Would you like me to split it into parallel
> code-writers? (yes = 2 agents in parallel, no = 1 agent sequentially)"
```

If yes: split the plan into logical chunks and launch one agent per chunk.

#### Before launching: Update status to "In progress"

Before launching any code-writer agent(s), update the task status in Notion:

```
notion-update-page
  page_id: "[task page ID from Phase 1]"
  command: "update_properties"
  properties: {
    "Status": "In progress"
  }
```

---

### Phase 2: Launch code-writer agent(s)

#### Single code-writer (small/medium task):

```
Agent(
  description="Implement Notion task: [task name]",
  prompt="## Task: [task name]\n\n## Important: Fetch the task from Notion first!\nUse notion-fetch to get the full task details:\n```\nnotion-fetch\n  page_id: \"[task page ID]\"\n```\n\nThis will give you:\n- Full implementation plan from the page content\n- Acceptance criteria\n- Files to Change section\n- Step-by-step instructions\n\n## Project path:\n./\n\n## Your job:
1. Fetch task details from Notion using notion-fetch with page_id: "[task page ID]"
2. Read relevant rules in rules/ (if exists)
3. Explore similar features in src/features/ (if exists)
4. Implement the code following the plan exactly
5. Run any needed migrations (check package.json scripts)
6. Run build command (check package.json scripts)
7. Fix any TypeScript errors
8. Report: files created/modified, commands run, build status, which acceptance criteria are addressed
  subagent_type="general-purpose",
  model="sonnet"
)
```

#### Multiple code-writers in parallel (large task):

Launch **all agents in the same turn** (parallel). Each gets a chunk of the plan:

```
Agent(
  description="Implement chunk 1: [chunk description]",
  prompt="## Task: [task name] — Chunk 1 of N\n\n## Scope:\nThis chunk covers: [chunk description]\n\n## Important: Fetch the task from Notion first!\nUse notion-fetch to get the full task details:\n```\nnotion-fetch\n  page_id: \"[task page ID]\"\n```\n\n## Plan (chunk only):\n[steps/files for this chunk]\n\n## Acceptance Criteria (chunk only):\n[relevant criteria for this chunk]\n\n## Files to Change (chunk only):\n[files for this chunk]\n\n## Project path:\n./\n\n## Important:\n- Other agents are implementing other chunks in parallel\n- Do NOT modify files that another chunk owns\n- Coordinate via clear file boundaries\n- Fetch task details from Notion first\n- Run bun build after your chunk\n\n## Your job:\n1. Fetch task details from Notion using notion-fetch with page_id: \"[task page ID]\"\n2. Read relevant rules in rules/ (if exists)\n3. Explore similar features in src/features/ (if exists)\n4. Implement your chunk only\n5. Run any needed migrations (check package.json scripts)\n6. Run build command (check package.json scripts)\n7. Fix any TypeScript errors\n8. Report: files created/modified, build status, criteria covered",
  subagent_type="general-purpose",
  model="sonnet"
)

Agent(
  description="Implement chunk 2: [chunk description]",
  prompt="## Task: [task name] — Chunk 2 of N\n\n[same structure as chunk 1 above, adapted for chunk 2]",
  subagent_type="general-purpose",
  model="sonnet"
)
```

**After all agents complete**: Merge their reports. If any agent failed, report
the error to the user and stop. If all succeeded, proceed to Phase 3.

---

### Phase 3: Tester agent (ONLY if Test sub-task exists)

**IMPORTANT: Skip this entire phase if the task has no Test sub-task.**

If the task has a `Sub-item` relation pointing to a Test page:

1. **Update task status to "Waiting for Testing":**
```
notion-update-page
  page_id: "[task page ID from Phase 1]"
  command: "update_properties"
  properties: {
    "Status": "Waiting for Testing"
  }
```

2. **Update Test sub-task status to "In progress":**
```
notion-update-page
  page_id: "[Test sub-task page ID]"
  command: "update_properties"
  properties: {
    "Status": "In progress"
  }
```

3. **Launch tester agent:**

```
Agent(
  description="Test implemented feature: [task name]",
  prompt="## Task: [task name]\n\n## Important: Fetch the task and Test sub-task from Notion first!\nUse notion-fetch to get the full details:\n```\nnotion-fetch\n  page_id: \"[main task page ID]\"\nnotion-fetch\n  page_id: \"[test sub-task page ID]\"\n```\n\nThis will give you:\n- Acceptance criteria from main task\n- UAT / Test Scenarios from Test sub-task\n- Pages to verify\n\n## Project path:\n./\n\n## Dev server:\n- URL: http://localhost:3000\n- Start if not running: check package.json for dev script (e.g., `bun dev`, `npm run dev`)\n\n## Auth:\n- Check PROJECT-NOTION.md or ask user for login credentials\n- Common default: username/password from dev setup\n\n## Testing Strategy\n\n### Testing Priority\n\n1. **Use playwright-cli FIRST** for all standard testing:\n   - Navigation, form filling, button clicks, dropdown selections\n   - Creating records, login/logout flows\n\n2. **Use playwright MCP ONLY when you need:**\n   - Visual verification of complex UI\n   - Inspecting CSS/layout issues\n   - Taking screenshots\n\n### playwright-cli Usage\n\n```bash\n# Install if needed\nwhich playwright-cli || npm install -g @playwright.cli@latest\n\n# Open browser and login\nplaywright-cli open http://localhost:3000/login\nplaywright-cli snapshot\n# Fill in login form (refs may vary, use snapshot to find them)\nplaywright-cli fill [username_field] [username]\nplaywright-cli fill [password_field] [password]\nplaywright-cli click [login_button]\n\n# Navigate\nplaywright-cli goto http://localhost:3000/[page]\nplaywright-cli snapshot\n\n# Click buttons/links\nplaywright-cli click [element_ref]\n\n# Check console errors\nplaywright-cli console error\n\n# Save auth state\nplaywright-cli state-save test-session.json\n```\n\n## Your job:\n1. Fetch task details from Notion using notion-fetch\n2. Ensure dev server is running\n3. Login to the app\n4. Navigate to each page and verify the acceptance criteria AND UAT scenarios\n5. Report PASS/FAIL/SKIP for each criterion and UAT scenario\n6. Take screenshots and check console for errors",
  subagent_type="general-purpose",
  model="sonnet"
)
```

Wait for the agent to complete. Report the results to the user.

**If NO Test sub-task exists**: Skip this entire phase and proceed directly to Phase 4.

---

### Phase 4: Commit + mark Done

#### Step 4a: Update status to "Waiting for Review"

**MANDATORY — update before asking for confirmation.**

Update the main task status to "Waiting for Review":

```
notion-update-page
  page_id: "[task page ID from Phase 1]"
  command: "update_properties"
  properties: {
    "Status": "Waiting for Review"
  }
```

If Test sub-task exists, update it too:

```
notion-update-page
  page_id: "[Test sub-task page ID]"
  command: "update_properties"
  properties: {
    "Status": "Waiting for Review"
  }
```

#### Step 4b: Show results and ask confirmation

**This step is MANDATORY. Do NOT auto-commit.**

Run `git diff --stat` and `git status` to show a summary:

```
## Implementation Complete

**Code-writer result:** [summary from Phase 2]
- Files: [list]
- Build: [success/error]

**Tester result:** [summary from Phase 3 — or "Skipped (no Test sub-task)"]
- Criteria: [N passed, M failed, K skipped]
- Issues: [if any]

**Changed files:**
[git diff --stat output]

To commit:
git commit -m "[conventional commit message]"
git push

Mark task as Done in Notion after pushing?
```

Wait for user confirmation.

#### Step 4c: Ask for push confirmation

**MANDATORY — ask before pushing.**

```json
{
  "question": "Ready to commit and push?",
  "header": "Git Push",
  "multiSelect": false,
  "options": [
    {"label": "Commit only", "description": "Commit the changes but do NOT push to remote"},
    {"label": "Commit and push", "description": "Commit and push to remote"},
    {"label": "Skip", "description": "Do not commit or push yet"}
  ]
}
```

- If "Commit only" → commit only, do NOT push
- If "Commit and push" → commit and push
- If "Skip" → do not commit or push

After user selection, run:
```bash
git add [changed files]
git commit -m "[commit message following conventional commits]"
git push  # only if user selected "Commit and push"
```

#### Step 4d: Mark task as Done

**IMPORTANT: Only mark Done if user selected "Commit and push" in Step 4c.**

If "Commit and push" → Update the task status from "Waiting for Review" to "Done":

```
notion-update-page
  page_id: "[task page ID]"
  command: update_properties
  properties: {
    "Status": "Done"
  }
```

If "Commit only" or "Skip" → Do NOT mark as Done. Inform the user:
> "Task NOT marked as Done. Please mark it Done manually in Notion once you're ready."

---

## Conflict Detection

### How to Check for Conflicts

1. Extract "Files to Change" from the task plan
2. Search Notion for other tasks with statuses:
   - `In progress`
   - `Waiting for Testing`
   - `Waiting for Review`
3. Compare their "Files to Change" sections
4. If overlap exists, warn the user before proceeding

### Warning Message

If conflicts detected:

```
## ⚠️ Conflict Warning

The following files may be modified by other active tasks:
- `src/features/insurance/dal.ts` (also in "Add insurance feature" task)
- `src/features/insurance/api.ts` (also in "Add insurance feature" task)

**Recommendation:** Consider waiting for other tasks to complete before
starting this implementation to avoid merge conflicts.
```

---

## Important Rules

- **Always check for conflicts** — Phase 1c is mandatory
- **Tester agent is conditional** — only runs if Test sub-task exists
- **Always ask before committing** — never auto-commit
- **No worktree** — implement directly on the current branch
- **Dev server on port 3000** — assume `bun dev` is running or start it
- **Code-writer(s) first, tester second** — tester only if Test sub-task exists
- **Parallel code-writers for large tasks** — assess scope and offer
- **Fresh agent contexts** — each agent gets its own context
- **Mark Done after successful push** — not before
