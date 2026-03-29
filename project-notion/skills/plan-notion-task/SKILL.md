---
name: plan-notion-task
description: >
  Create a detailed task plan and write it into a Notion task page for the
  current project defined in PROJECT-NOTION.md. Use this skill whenever the
  user wants to plan out a task, break it into steps, add implementation details,
  or write a checklist/sub-plan into a Notion task. Also triggers when the user
  says "plan this task", "break down this task", "add steps to task", "write
  task plan", "add implementation plan", or "document the task plan". This
  skill can: (1) create a new task in Notion if it doesn't exist, (2) add
  detailed implementation plan to existing task, (3) optionally create a Test
  sub-task page for testing details. Uses Notion MCP notion-fetch,
  notion-update-page, and notion-create-page tools, and enters plan mode to
  think hard before drafting.
compatibility: Notion MCP tools (notion-search, notion-fetch, notion-update-page, notion-create-page)
prerequisite: PROJECT-NOTION.md must exist in project root
---

# Plan Notion Task

Create a detailed implementation plan and write it to a Notion task page. This
skill enters plan mode, thinks hard, drafts the plan, asks for confirmation
with the plan displayed, then writes to Notion.

## When to Use

- User wants to plan an existing Notion task in detail
- User describes a task they want to plan (can create new task if doesn't exist)
- Task needs detailed implementation steps + acceptance criteria
- Optionally includes Test sub-task for UAT scenarios

## Prerequisite Check

**MANDATORY — do this first.**

Before starting, verify `PROJECT-NOTION.md` exists:

```bash
PROJECT_NOTION_PATH="./PROJECT-NOTION.md"
if [ ! -f "$PROJECT_NOTION_PATH" ]; then
  echo "ERROR: PROJECT-NOTION.md not found. Run 'init-project-notion' skill first."
  echo "Aborting plan-notion-task."
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

## 8-Phase Workflow

### Phase 1: Identify or Create the Task

**Skill invocation provides:** task name, URL, or description.

- **If URL provided** → extract page ID and fetch directly
- **If name provided** → search Notion:

```
notion-search
  query: "[task name]"
  query_type: internal
  page_size: 5
```

Pick the first matching result. If no match found:
- Ask user if they want to **create a new task** in Notion
- If yes, collect: task name, brief description, milestone (from existing or new)

**If task already exists** → fetch and check if it has Description/plan content:
- Has content → propose adding Test sub-task only
- No content → propose creating full plan

---

### Phase 2: Detect Type Prefix

**MANDATORY — do this immediately after Phase 1.**

Analyze the task name to detect or infer the type prefix:

1. **Explicit prefix** — normalize to lowercase + colon:
   - `fix:`, `Fix:`, `FIX:` → `fix:`
   - `add:`, `Add:`, `ADD:` → `feat:` (use feat: for add/create)
   - `bug:`, `Bug:`, `BUG:` → `fix:`
   - `refactor:`, `Refactor:`, `REFACTOR:` → `refactor:`
   - `test:`, `Test:`, `TEST:` → `test:`
   - `chore:`, `Chore:`, `CHORE:` → `chore:`
   - `feat:`, `Feat:`, `FEAT:` → `feat:`

2. **Keyword inference** (when no explicit prefix):
   - "access denied", "doesn't show", "not showing", "error" → `fix:`
   - "add", "create", "new" → `feat:`
   - "refactor", "rename", "restructure" → `refactor:`
   - "test", "testing", "verify", "uat" → `test:`
   - "chore", "maintenance", "upgrade" → `chore:`
   - Default → no prefix

3. **Name normalization:**
   - Strip existing prefix before re-applying
   - Title case first letter after prefix
   - Plain names stay unchanged

---

### Phase 3: Enter Plan Mode

**MANDATORY — do this after Phase 2.**

```
EnterPlanMode
```

Set plan title to the task name. Use plan file:
`/home/wawan/.claude/plans/[short-task-name].md`

---

### Phase 4: Think Hard

**Run research to inform the plan:**

**Agent 1 — Explore similar features:**
```
Find similar existing features in src/features/ that match this task.
Use Glob + Grep to explore. Report: (1) most similar feature,
(2) key files to reference, (3) patterns to copy.
```

**Agent 2 — Read project context:**
```
Read PROJECT-NOTION.md to understand the project structure.
Also read CLAUDE.md if it exists for project conventions.
```

While agents run, read the current Notion task page (if exists) to understand existing context.

---

### Phase 5: Draft the Plan

#### 5a: Determine Plan Size

Assess the task scope:

| Size | Criteria |
|------|----------|
| Small | 1-3 steps, single area |
| Medium | 4-7 steps, one feature area |
| Large | 8+ steps, multiple areas or complex |

#### 5b: Draft Plan Content

**Plan A — Main Task Plan:**

```markdown
# Plan: [TYPE PREFIX] [Task Name]

## Context
[Why this task exists — 1-3 sentences]

## Scope
[What this task covers]
[What this task does NOT cover]

## Files to Change           ← REQUIRED
- `src/path/to/file1.ts`
- `src/path/to/file2.tsx`

## Step-by-Step Implementation
### Step 1: [Name]
[Specific actionable item with file paths and code snippets]

### Step 2: [Name]
[...]

## Summary Table
| # | Step | Key Files |
|---|------|-----------|
| 1 | Step 1 | file1.ts |

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

---

#### 5c: Ask About Test Sub-Task

**MANDATORY — ask user if they want a Test sub-task.**

```json
{
  "question": "Do you want to create a Test sub-task page for this task?",
  "header": "Test Sub-task",
  "multiSelect": false,
  "options": [
    {"label": "Yes, create Test sub-task", "description": "Create a Test page with UAT scenarios"},
    {"label": "No, skip testing", "description": "No test sub-task needed"}
  ]
}
```

If "Yes", also ask about test type:
```json
{
  "question": "What type of testing is needed?",
  "header": "Test Type",
  "multiSelect": false,
  "options": [
    {"label": "Manual UAT", "description": "User acceptance testing scenarios"},
    {"label": "Automated tests", "description": "Unit/integration tests"},
    {"label": "Both", "description": "Manual UAT + automated tests"}
  ]
}
```

**Plan B — Test Sub-Task (if requested):**

```markdown
# Test: [Task Name]

## Test Strategy
[How to test — manual testing approach, edge cases]

## Test Cases

### Manual Testing Checklist
- [ ] Checklist item 1
- [ ] Checklist item 2

## UAT (User Acceptance Testing)

| # | Scenario | Steps | Expected Result |
|---|---|---|---|
| 1 | [Name] | [Steps] | [Outcome] |
| 2 | ... | ... | ... |
```

---

### Phase 6: Show Plan and Confirm

**CRITICAL — ALWAYS show the complete plan before writing to Notion.**

Display the full plan:

```
## Plan for: [Task Name]

**Type:** [feat: / fix: / etc.]
**Size:** [Small / Medium / Large]
**Test Sub-task:** [Yes / No]

---

### Main Plan:

[Full Plan A content]

### Test Plan (if requested):

[Full Plan B content]

---

**Files to Change:**
- [list of files]
```

Then ask for confirmation:

```json
{
  "question": "Plan sudah siap. Ada perubahan sebelum ditulis ke Notion?",
  "header": "Konfirmasi Plan",
  "multiSelect": false,
  "options": [
    {"label": "Write to Notion", "description": "Langsung tulis plan ke Notion"},
    {"label": "Revise", "description": "Saya ingin revisi plan terlebih dahulu"}
  ]
}
```

If user selects "Revise" → ask what to change, update plan, re-show.

---

### Phase 7: Write to Notion

**After user approves, write to Notion.**

#### Step 7a: Create OR UPDATE task page

**If creating NEW task (task didn't exist before):**

Extract IDs:
```bash
PROJECT_ID="$(get_notion_project_id)"
MILESTONE_ID="$(get_current_milestone_id)"
TASKS_DB="$(get_tasks_database)"
```

Create in Tasks database:
```
notion-create-page
  parent: { data_source_id: "$TASKS_DB" }
  pages: [{
    properties: {
      "Name": "[TYPE PREFIX] [Task Name]",
      "Description": "[Brief ~400 char summary]",
      "Status": "Planning",
      "Projects": "[\"https://www.notion.so/$PROJECT_ID\"]",
      "Milestone": "[\"https://www.notion.so/$MILESTONE_ID\"]"
    },
    content: "[Full Plan A content]"
  }]
```

Wait for response to get the **new task page ID**.

**If UPDATING existing task (task already has content):**
```
notion-update-page
  page_id: "[task page ID]"
  command: "update_properties"
  properties: {
    "Description": "[Brief ~400 char summary]"
  }
```

```
notion-update-page
  page_id: "[task page ID]"
  command: "replace_content"
  new_str: "[Full Plan A content]"
```

#### Step 7b: Create Test Sub-task (if requested)

If user said "Yes" to Test sub-task:

```
notion-create-page
  parent: { data_source_id: "$TASKS_DB" }
  pages: [{
    properties: {
      "Name": "Test: [Task Name]",
      "Description": "[Brief test scope summary]",
      "Status": "Planning",
      "Parent item": "[\"https://www.notion.so/[TASK-PAGE-ID]\"]",
      "Projects": "[\"https://www.notion.so/$PROJECT_ID\"]",
      "Milestone": "[\"https://www.notion.so/$MILESTONE_ID\"]"
    },
    content: "[Full Plan B content]"
  }]
```

Wait for response to get the **Test sub-task page ID**.

#### Step 7c: Set Sub-item on main task

If Test sub-task was created:
```
notion-update-page
  page_id: "[task page ID]"
  command: update_properties
  properties: {
    "Sub-item": "[\"https://www.notion.so/[TEST-PAGE-ID]\"]"
  }
```

---

### Phase 8: Confirm

Show the user:
- Main task name + Notion URL
- Test sub-task name + Notion URL (if created)
- Summary: plan size, number of steps, number of UAT scenarios

---

## Format Reference

### Type Prefix Examples

| Input Name | Detected Type | Output Name |
|---|---|---|
| "fix: Access denied bug" | fix: | "fix: Access denied bug" |
| "Add button to bucket" | feat: | "feat: Add button to bucket" |
| "Bug: click propagation" | fix: | "fix: Click propagation" |
| "Refactor: timeline utils" | refactor: | "refactor: Timeline utils" |
| "Test: User Setting" | test: | "test: User Setting" |
| "Create bucket template" | feat: | "feat: Create bucket template" |
| "Horizontal Timeline" | (none) | "Horizontal Timeline" |

### Description Field (~400 chars max)

```
Track insurance policies (HEALTH + LIFE types). Steps: (1) Add Insurance Prisma model.
(2) Create src/features/insurance/ with DAL, API, TanStack Query, UI. (3) Create
/dashboard/insurance page. Run: bun prisma migrate dev --name add_insurance_model
```

### Files to Change Section (REQUIRED)

Every plan MUST include a "Files to Change" section listing all expected files:

```markdown
## Files to Change
- `src/features/insurance/dal.ts`
- `src/features/insurance/api.ts`
- `src/features/insurance/queries.ts`
- `src/app/(dashboard)/dashboard/insurance/page.tsx`
- `prisma/schema.prisma`
```

---

## Important Rules

- **Files to Change is REQUIRED** — every plan must list expected files to modify
- **ALWAYS show plan before writing** — never skip Phase 6
- **ALWAYS write to Notion after confirmation** — don't ask about implementation
- **Test sub-task is optional** — always ask user preference
- **Use type prefixes** — feat:, fix:, refactor:, chore:, test:, etc.
- **Plan size classification** — helps user understand scope
- **Description field is MANDATORY** — ~400 chars max
- **Use the conversation language** — if user communicates in Indonesian, use Indonesian in UI labels and UAT; if in English, use English
- **Split large tasks** — if 10+ steps, consider splitting
