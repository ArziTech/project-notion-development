# CLAUDE.md — Project Notion

## Project Type

**Template for Claude Code + Notion integration.** This is NOT a web application — it provides reusable skills and workflows for managing Notion tasks from Claude Code.

## Project Name

Project Notion

## Key Files

| File | Purpose |
|------|---------|
| `PROJECT-NOTION.md` | Project configuration — Notion project ID, milestone IDs, description |
| `.claude/skills/plan-notion-task/` | Skill for creating detailed task plans in Notion |
| `.claude/skills/implement-notion-task/` | Skill for implementing Notion tasks via agents |
| `.claude/skills/init-project-notion/` | Skill for initializing new Notion-integrated projects |

## How the Workflow Works

1. **User creates task** in Notion workspace
2. **Plan it** → Use `plan-notion-task` skill → Creates implementation plan + Test sub-task in Notion
3. **Implement it** → Use `implement-notion-task` skill → Code-writer agents build the feature
4. **Test it** → Playwright CLI verifies acceptance criteria + UAT scenarios
5. **Done** → Task marked as Done in Notion after commit

## Project Configuration (PROJECT-NOTION.md)

All Notion IDs are configured in `PROJECT-NOTION.md`:

```yaml
---
notion-project-id:
  project-name=project-id
milestone-in-projects:
  milestone-name-1=milestone-id-1
  milestone-name-2=milestone-id-2
current-milestone:
  milestone-name-1=milestone-id-1
project-description:
  write project description here
github-repository:
  https://github.com/some-repository
---
```

**Important:** Skills read from this file at runtime — no hardcoded IDs in skill definitions.

## Environment

- **Package manager**: Bun (`bun install`, `bun run`, etc.)
- **Node.js**: Via nvm (`~/.config/nvm`)
- **Skills execution**: Claude Code Skill tool
- **Notion access**: Notion MCP tools (`notion-search`, `notion-fetch`, `notion-update-page`, `notion-create-page`)
- **Testing**: Playwright CLI (`playwright-cli`)

## Skills

### plan-notion-task

Creates detailed implementation plans and writes them to Notion task pages.

**Triggers**: "plan this task", "break down this task", "write task plan", "add implementation plan"

**Outputs**:
- Main task page with implementation plan
- Test sub-task page with UAT table

### implement-notion-task

Implements a Notion task by coordinating code-writer agents, then testing via Playwright CLI.

**Triggers**: "implement task X", "build task X", "code task X", "work on task X"

**Outputs**:
- Implemented code
- Test results (PASS/FAIL)
- Commit ready for review

### init-project-notion

Interactive setup wizard for new projects. Asks for project name, Notion IDs, and generates `PROJECT-NOTION.md`.

**Triggers**: When setting up a new Notion-integrated project

## Git Workflow

1. Implement on feature branch
2. Commit with conventional commit message
3. Push to remote
4. Mark task Done in Notion after successful push

## Important Rules

- **Skills read IDs from PROJECT-NOTION.md** — never hardcode Notion IDs in skill definitions
- **Always ask before committing** — never auto-commit
- **Use playwright-cli first** — use playwright MCP only for visual verification
- **Fresh agent contexts** — each agent gets its own context to reduce window pressure
- **Mark Done after successful push** — not before
