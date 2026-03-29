---
name: brainstorm-notion-task
description: >
  Brainstorm and plan a new feature or project by creating multiple task pages
  in Notion. Use this skill when the user wants to brainstorm an idea, plan a
  new project phase, or create multiple related tasks in Notion. This skill
  helps clarify the user's intent, breaks it down into manageable tasks, and
  writes them to Notion. Also triggers when user says "brainstorm", "plan
  project", "new feature planning", or "create tasks for X".
compatibility: Notion MCP tools (notion-search, notion-fetch, notion-update-page, notion-create-page)
prerequisite: PROJECT-NOTION.md must exist in project root
---

# Brainstorm Notion Task

This skill helps users brainstorm and plan by creating multiple task pages in
Notion. It focuses on understanding the user's intent, analyzing scope, and
creating a structured set of tasks with many confirmation points.

## When to Use

- User wants to brainstorm a new feature or project
- User wants to plan multiple related tasks at once
- User wants to create a new milestone with tasks
- User says "brainstorm", "plan project", "new feature planning"

## Prerequisite Check

**MANDATORY — do this first.**

Before starting, verify `PROJECT-NOTION.md` exists:

```bash
PROJECT_NOTION_PATH="./PROJECT-NOTION.md"
if [ ! -f "$PROJECT_NOTION_PATH" ]; then
  echo "ERROR: PROJECT-NOTION.md not found. Run 'init-project-notion' skill first."
  echo "Aborting brainstorm-notion-task."
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

# Get milestone dictionary
get_milestones_dict() {
  grep "^milestone-in-projects:" -A 10 "$PROJECT_NOTION_PATH" | grep -v "milestone-in-projects:" | tr -d ' ' | grep -v "^$"
}

# Get Tasks database data source
get_tasks_database() {
  grep "^tasks-database" "$PROJECT_NOTION_PATH" | cut -d: -f2 | tr -d ' '
}
```

---

## 6-Phase Workflow

### Phase 1: Capture User Intent

**Ask the user what they want to build/create:**

```json
{
  "question": "What would you like to build or create? Describe your idea in detail.",
  "header": "Brainstorm",
  "multiSelect": false,
  "options": [
    {"label": "Continue", "description": "I'll describe what I want"}
  ]
}
```

Listen carefully to the user's response. Extract:
- **Core idea**: What is the main thing they want to build?
- **Scope hints**: What does it include? What might it NOT include?
- **Priority**: Is this urgent, nice-to-have, or exploratory?

Store this in your context as `USER_INTENT`.

---

### Phase 2: Clarifying Questions

**MANDATORY — ask at least 3 clarifying questions before proceeding.**

Based on the user's intent, ask questions to understand:

1. **Scope clarification**:
   - "What should be included in this feature?"
   - "What should NOT be included initially?"
   - "Are there any constraints I should know about?"

2. **Priority/Size**:
   - "How large is this? Small (1-2 tasks), Medium (3-5 tasks), or Large (6+ tasks)?"
   - "What's the priority for this?"

3. **Dependencies**:
   - "Does this depend on any existing features?"
   - "Should this be split into phases?"

Use `AskUserQuestion` for each clarification. Wait for user response before asking the next.

---

### Phase 3: Analyze and Draft Tasks

Based on user intent + clarifications, analyze and create a task list:

#### 3a: Determine Plan Size

Classify the scope:

| Size | Criteria | # of Tasks |
|------|----------|------------|
| Small | Single feature, 1-2 distinct changes | 1-2 |
| Medium | Multiple related changes, single area | 3-5 |
| Large | Multiple areas, complex dependencies | 6+ |

#### 3b: Draft Task List

For each task, define:
- **Task name** (with type prefix: feat:, fix:, refactor:, chore:, etc.)
- **Brief description** (~400 chars for Notion)
- **Files likely to change** (REQUIRED)
- **Acceptance criteria** (3-5 items)

**IMPORTANT: Every task plan MUST include a "Files to Change" section.**

```markdown
## Task Draft: [Task Name]

### Description
[Brief description ~400 chars]

### Files to Change
- `src/path/to/file1.ts`
- `src/path/to/file2.tsx`
- `src/path/to/file3.css`

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Type Prefix
[feat: / fix: / refactor: / chore:]
```

#### 3c: Ask About Milestone

First, extract all milestones from PROJECT-NOTION.md:

```bash
# Get all milestones from PROJECT-NOTION.md
MILESTONES=$(grep "^milestone-in-projects:" -A 10 "$PROJECT_NOTION_PATH" | grep -v "milestone-in-projects:" | grep -v "^$" | grep "=")

# Parse into options format
# Each line is: milestone-name=milestone-id
```

Show all known milestones and ask user whether to:
1. Add tasks to an existing milestone (choose from list)
2. Create a new milestone for these tasks

```json
{
  "question": "Where should these tasks belong?",
  "header": "Milestone",
  "multiSelect": false,
  "options": [
    {"label": "[Milestone Name 1]", "description": "Use existing milestone 1"},
    {"label": "[Milestone Name 2]", "description": "Use existing milestone 2"},
    {"label": "Create new milestone", "description": "Create a new milestone for these tasks"}
  ]
}
```

Build the options dynamically from the milestones in PROJECT-NOTION.md. Include all milestones listed there, marking the current milestone with "(current)" in the description.

- If "Create new milestone" → Ask for milestone name, then create it in Notion
- If "Add to current milestone" → Use existing milestone

---

### Phase 4: Show Draft and Ask Confirmation

**CRITICAL — show the complete draft before writing to Notion.**

Display all drafted tasks with full details:

```
## Brainstorm Result

**User Intent:** [USER_INTENT]

**Plan Size:** [Small/Medium/Large]

**Milestone:** [Existing or New]

---

### Task 1: [Name]
**Description:** [description]
**Files to Change:**
- [file1]
- [file2]
**Acceptance Criteria:**
- [ ] [criterion 1]
- [ ] [criterion 2]

### Task 2: [Name]
[...]

---

Total: [N] tasks
```

Then ask for confirmation:

```json
{
  "question": "Apakah draft tugas sudah sesuai? Lanjut tulis ke Notion?",
  "header": "Konfirmasi Draft",
  "multiSelect": false,
  "options": [
    {"label": "Write to Notion", "description": "Langsung tulis semua task ke Notion"},
    {"label": "Revise", "description": "Saya ingin merevisi draft terlebih dahulu"}
  ]
}
```

If user selects "Revise" → Ask specifically what to change, update draft, then re-show.

---

### Phase 5: Write to Notion

**After user approves, write tasks to Notion.**

#### Step 5a: Create Milestone (if new)

If user chose to create a new milestone:

First, extract project ID:
```bash
PROJECT_ID="$(get_notion_project_id)"
```

Create the milestone page (as a child of the project):
```
notion-create-page
  parent: { page_id: "$PROJECT_ID" }
  pages: [{
    properties: {
      "title": "[Milestone Name]"
    },
    content: "Milestone: [Milestone Name]\n\n[Optional description]"
  }]
```

Wait for response to get the **new milestone ID**.

#### Step 5b: Extract IDs

```bash
PROJECT_ID="$(get_notion_project_id)"
MILESTONE_ID="$(get_current_milestone_id)"
TASKS_DB="$(get_tasks_database)"
```

#### Step 5c: Create Task Pages

For each drafted task, create a page in the Tasks database:

```
notion-create-page
  parent: { data_source_id: "$TASKS_DB" }
  pages: [{
    properties: {
      "Name": "[Task Name]",
      "Description": "[Brief description ~400 chars]",
      "Status": "Not started",
      "Projects": "[\"https://www.notion.so/$PROJECT_ID\"]",
      "Milestone": "[\"https://www.notion.so/$MILESTONE_ID\"]"
    },
    content: "[Full task content with Files to Change, Acceptance Criteria, etc.]"
  }]
```

Wait for each response to get the task page ID.

---

### Phase 6: Confirm and Summarize

Show the user all created pages:

- List each task with its Notion URL
- Show total number of tasks created
- Show which milestone they belong to

Example:

```
## Brainstorm Complete

**Created [N] tasks in Notion:**

1. [Task Name 1](https://notion.so/...)
2. [Task Name 2](https://notion.so/...)
[...]

**Milestone:** [Milestone Name](https://notion.so/...)

---

**Next steps:**
- Use `plan-notion-task` to add detailed implementation plans to each task
- Use `implement-notion-task` to start implementing a task
```

---

## Important Rules

- **Many confirmations** — this skill asks for confirmation at multiple steps
- **Files to Change is REQUIRED** — every task draft must list expected files
- **Write to Notion is MANDATORY** — always write tasks, don't ask about implementation
- **Ask clarifying questions first** — don't jump straight to drafting
- **Use type prefixes** — feat:, fix:, refactor:, chore:, test:, etc.
- **Small/Medium/Large classification** — helps user understand scope
- **New milestone is optional** — ask user preference
- **Store user intent** — keep track of the original idea throughout the process
