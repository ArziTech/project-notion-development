# Project Notion Plugin

A Claude Code plugin for Notion task management workflow. Provides skills for brainstorming, planning, and implementing tasks directly in Notion.

## Installation

### Option 1: Local Development
```bash
claude --plugin-dir ./project-notion
```

### Option 2: Marketplace (when published)
```bash
/plugin install project-notion
```

## Skills

This plugin provides the following namespaced skills:

| Skill | Command | Description |
|-------|---------|-------------|
| Brainstorm | `/project-notion:brainstorm` | Brainstorm and create multiple task pages in Notion |
| Plan Task | `/project-notion:plan-notion-task` | Create detailed implementation plan for a task |
| Implement Task | `/project-notion:implement-notion-task` | Implement a task using code-writer agents |
| Init Project | `/project-notion:init-project-notion` | Initialize a new Notion-Claude Code project |

## Setup

### 1. Initialize PROJECT-NOTION.md

Before using the skills, you need to create a `PROJECT-NOTION.md` file in your project root:

```yaml
---
notion-project-id:
  Your Project=your-project-page-id
milestone-in-projects:
  MVP V1=your-milestone-page-id
  Phase 2=your-milestone-2-id
current-milestone:
  MVP V1=your-milestone-page-id
project-description:
  Your project description here
github-repository:
  https://github.com/your-repo
---
```

### 2. Get Notion Page IDs

To get a Notion page ID:
1. Open the page in Notion
2. Copy the URL: `https://www.notion.so/workspace/Page-Name-pageId`
3. The page ID is the 32-character string at the end (without hyphens)

### 3. Verify Connection

Run the init skill to verify your Notion connection:
```
/project-notion:init-project-notion
```

## Workflow

### Standard Task Flow

1. **Brainstorm** (`/project-notion:brainstorm`)
   - Describe your idea
   - Get clarifying questions
   - See drafted tasks
   - Tasks are written to Notion

2. **Plan** (`/project-notion:plan-notion-task`)
   - Select a task from Notion (or create new)
   - Enter plan mode for detailed analysis
   - Add implementation steps + acceptance criteria
   - Optionally create Test sub-task for UAT

3. **Implement** (`/project-notion:implement-notion-task`)
   - Code-writer agent implements the code
   - (Optional) Tester agent verifies via Playwright
   - Ask for commit confirmation
   - Mark task Done after successful push

## Project Structure

```
project-notion/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── skills/
│   ├── brainstorm-notion-task/
│   │   └── SKILL.md         # Brainstorming skill
│   ├── plan-notion-task/
│   │   ├── SKILL.md         # Planning skill
│   │   └── references/
│   │       └── context.md   # Notion schema docs
│   ├── implement-notion-task/
│   │   ├── SKILL.md         # Implementation skill
│   │   └── references/
│   │       └── context.md   # Notion schema docs
│   └── init-project-notion/
│       ├── SKILL.md         # Init wizard skill
│       └── references/
│           └── context.md   # Notion schema docs
└── README.md
```

## Notion Database Schema

The skills expect the following Notion database structure:

- **Projects** (top-level page)
- **Milestones** (under Projects)
- **Tasks** (database with relation to Milestones)

See `skills/*/references/context.md` for detailed schema documentation.

## Configuration

### Dynamic IDs

All Notion IDs are read from `PROJECT-NOTION.md` at runtime. No hardcoded IDs.

### Status Workflow

Tasks follow this status flow:
1. `Not started`
2. `Planning`
3. `In progress`
4. `Waiting for Testing`
5. `Waiting for Review`
6. `Done`

## Troubleshooting

### "PROJECT-NOTION.md not found"
Run `/project-notion:init-project-notion` to create the configuration file.

### Skills not appearing
Run `/reload-plugins` to refresh the plugin.

### Notion API errors
Verify your Notion MCP is configured and you have access to the pages.

## License

MIT
