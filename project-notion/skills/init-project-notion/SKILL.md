---
name: init-project-notion
description: >
  Initialize a new Notion-Claude Code integration project. Use this skill when
  setting up a new project that will use Notion for task management. This skill
  creates PROJECT-NOTION.md with your Notion configuration, validates the Notion
  IDs work, and prepares the project for use with plan-notion-task and
  implement-notion-task skills. Also triggers when user says "init project",
  "setup notion", "initialize notion project", "new notion project", or when
  PROJECT-NOTION.md is missing and another skill requires it.
compatibility: Notion MCP tools (notion-fetch, notion-search), Bash
---

# Init Project Notion

Interactive setup wizard that initializes a new Notion-Claude Code integration project.

## When to Use

- Setting up a new project with Notion integration
- When `PROJECT-NOTION.md` is missing and other skills abort
- When you want to reinitialize with different Notion IDs

## What This Skill Does

1. **Collects project information** via interactive prompts
2. **Validates Notion IDs** by fetching the project page
3. **Generates PROJECT-NOTION.md** with YAML frontmatter
4. **Confirms setup** is complete

---

## Step 1: Check for Existing PROJECT-NOTION.md

```bash
if [ -f "./PROJECT-NOTION.md" ]; then
  echo "PROJECT-NOTION.md already exists!"
  echo "Content:"
  cat ./PROJECT-NOTION.md
fi
```

If it exists, ask the user:
> "PROJECT-NOTION.md already exists. Do you want to overwrite it with a new setup, or keep the existing configuration?"

- If "overwrite" → proceed with Step 2
- If "keep" → abort, the project is already initialized

---

## Step 2: Collect Project Information

### 2a: Project Name

Ask user for the project name (e.g., "Financial Plan App", "My Project"):

```json
{
  "question": "What is the name of your project? This will be used to identify your project in Notion.",
  "header": "Project Name",
  "multiSelect": false,
  "options": [
    {"label": "Enter project name", "description": "I'll type the project name"}
  ]
}
```

### 2b: Notion Project Page ID

Ask user for the Notion project page ID. Explain that this is the 32-character ID from the Notion page URL.

```
Notion page URL format: https://www.notion.so/workspace-name/PROJECT-NAME-PageId
The PageId is the 32-character string at the end of the URL (without hyphens).
```

### 2c: Milestones

Ask user for milestone IDs. They can add multiple milestones.

For each milestone, ask:
1. Milestone name (e.g., "MVP V1", "Phase 2", "Beta")
2. Milestone Notion page ID

Continue asking until user says "done".

### 2d: Current Milestone

From the milestones added, ask which one is the current/active milestone.

```json
{
  "question": "Which milestone is the current active one?",
  "header": "Current Milestone",
  "multiSelect": false,
  "options": [
    {"label": "<milestone-name-1>", "description": "Milestone 1"},
    {"label": "<milestone-name-2>", "description": "Milestone 2"}
  ]
}
```

### 2e: GitHub Repository URL (optional)

Ask user for the GitHub repository URL (optional, can be skipped):

```json
{
  "question": "What is the GitHub repository URL for this project? (optional)",
  "header": "GitHub URL",
  "multiSelect": false,
  "options": [
    {"label": "Skip", "description": "No GitHub repo yet"},
    {"label": "Enter URL", "description": "I'll provide the GitHub URL"}
  ]
}
```

---

## Step 3: Validate Notion IDs

Before writing the file, validate the IDs by attempting to fetch from Notion:

### 3a: Validate Project Page ID

```
notion-fetch
  page_id: "[project-page-id]"
```

If this fails, tell the user and ask for a corrected ID.

### 3b: Validate Milestone IDs

For each milestone ID provided, validate with notion-fetch:

```
notion-fetch
  page_id: "[milestone-page-id]"
```

If any fail, ask the user to correct them.

---

## Step 4: Generate PROJECT-NOTION.md

Write the PROJECT-NOTION.md file with YAML frontmatter:

```bash
cat > ./PROJECT-NOTION.md << 'EOF'
---
notion-project-id:
  [project-name]=[project-id]
milestone-in-projects:
  [milestone-name-1]=[milestone-id-1]
  [milestone-name-2]=[milestone-id-2]
current-milestone:
  [current-milestone-name]=[current-milestone-id]
project-description:
  [project-description]
github-repository:
  [github-url-or-empty]
---
EOF
```

**Example output:**

```yaml
---
notion-project-id:
  Financial Plan App=325735d212fe808bb38ae6f68a747619
milestone-in-projects:
  MVP V1=325735d212fe808790c4f500d6a0bf3e
  Phase 2=325735d212fe808690c4f500d6a0bf3f
current-milestone:
  MVP V1=325735d212fe808790c4f500d6a0bf3e
project-description:
  Financial planning and tracking application
github-repository:
  https://github.com/user/repo
---
```

---

## Step 5: Confirm Setup

Show the user the generated file:

```bash
cat ./PROJECT-NOTION.md
```

Tell the user:
> "Project Notion has been initialized successfully! Your `PROJECT-NOTION.md` is ready.
>
> **Next steps:**
> - Run `plan-notion-task` to create your first task plan
> - Run `implement-notion-task` to implement a task from Notion
>
> **Skills now available:**
> - `plan-notion-task` - Create detailed task plans in Notion
> - `implement-notion-task` - Implement Notion tasks via agents"

---

## Important Rules

- **Always validate IDs** before writing to PROJECT-NOTION.md — don't save invalid IDs
- **Ask before overwriting** if PROJECT-NOTION.md already exists
- **Use YAML frontmatter** — keep the format consistent with the example above
- **Milestones are optional** — a project can have just a project ID without milestones
- **Keep it simple** — PROJECT-NOTION.md should remain minimal and readable
