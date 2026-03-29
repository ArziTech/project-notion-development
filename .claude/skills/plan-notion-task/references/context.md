# Notion Database Schema Reference

This document describes the standard Notion database schema for the Project Management hierarchy used by plan-notion-task and implement-notion-task skills.

## Database Hierarchy

```
Projects (top-level)
    ↓ relation
Milestones (mid-level)
    ↓ relation
Tasks (bottom-level)
```

---

## 1. Projects Database

Represents top-level projects/initiatives.

### Properties

| Property Name | Type | Description |
|--------------|------|-------------|
| Name | Title | Project name |
| Status | Select | Project status (Not Started, In Progress, Completed, Archived) |
| Timeline | Date | Start and end dates for the project |
| Owner | Person | Person responsible for the project |

### Relations

| Property | Target Database | Cardinality |
|---------|----------------|------------|
| Milestones | Milestones | One project → Many milestones |

---

## 2. Milestones Database

Groups tasks into phases/checkpoints within a project.

### Properties

| Property Name | Type | Description |
|--------------|------|-------------|
| Name | Title | Milestone name (e.g., "MVP V1", "Phase 2") |
| Status | Select | Milestone status (Not Started, In Progress, Completed, Archived) |
| Due Date | Date | Target completion date |

### Relations

| Property | Target Database | Cardinality |
|---------|----------------|------------|
| Project | Projects | Many milestones → One project |
| Tasks | Tasks | One milestone → Many tasks |

---

## 3. Tasks Database

Individual action items within a milestone.

### Properties

| Property Name | Type | Description |
|--------------|------|-------------|
| Task Name | Title | Task title |
| Status | Status | Task status workflow |
| Assignee | Person | Person responsible for the task |
| Priority | Select | Priority level (Low, Medium, High, Urgent) |
| Due Date | Date | Task due date |
| Description | Text | Brief summary of the task/plan |

### Relations

| Property | Target Database | Cardinality |
|---------|----------------|------------|
| Milestone | Milestones | Many tasks → One milestone |
| Projects | Projects | Rollup via Milestone |
| Sub-item | Tasks | For test sub-tasks (bidirectional) |

### Status Workflow Values

Typical Status values for Tasks database:
- `Not started` — Task created but not started
- `Planning` — Task is being planned
- `In progress` — Task is being implemented
- `Waiting for Testing` — Implementation done, waiting for QA
- `Waiting for Review` — Testing done, waiting for code review
- `Done` — Task completed

### Special Properties

**Parent item** (relation): Points to parent task if this is a sub-task
**Sub-item** (relation): Points to test sub-task linked to this task

---

## Bidirectional Relations Pattern

The Tasks database uses bidirectional relations for parent-child relationships:

```
Main Task (e.g., "Create guide page")
    ├── Sub-item → Test: "Create guide page" (Test sub-task)

Test Sub-Task
    └── Parent item → Main Task
```

When creating a Test sub-task:
1. The main task has `Sub-item` relation pointing to the test task
2. The test task has `Parent item` relation pointing to the main task

---

## Notion API Property Formats

### Relation Property Format (for notion-create-page, notion-update-page)

Relations are stored as arrays of URLs:

```json
"Projects": "[\"https://www.notion.so/PROJECT-ID\"]"
"Milestone": "[\"https://www.notion.so/MILESTONE-ID\"]"
"Parent item": "[\"https://www.notion.so/PARENT-TASK-ID\"]"
```

### Status Property Format

```json
"Status": "Planning"
```

### URL Property Format

```json
"url": "https://www.notion.so/PAGE-ID"
```

---

## Using with Notion MCP Tools

### notion-create-page (Creating Test sub-task)

```json
{
  "parent": { "data_source_id": "collection://TASKS-DATABASE-ID" },
  "pages": [{
    "properties": {
      "Task Name": "Test: [Main Task Name]",
      "Description": "[Brief test scope summary]",
      "Status": "Planning",
      "Parent item": "[\"https://www.notion.so/MAIN-TASK-ID\"]",
      "Milestone": "[\"https://www.notion.so/MILESTONE-ID\"]"
    },
    "content": "[Test plan markdown]"
  }]
}
```

### notion-update-page (Updating task properties)

```json
{
  "page_id": "TASK-ID",
  "command": "update_properties",
  "properties": {
    "Status": "Done"
  }
}
```

### notion-update-page (Setting Sub-item relation)

```json
{
  "page_id": "MAIN-TASK-ID",
  "command": "update_properties",
  "properties": {
    "Sub-item": "[\"https://www.notion.so/TEST-TASK-ID\"]"
  }
}
```

---

## Property Names Reference

| Context | Property Name in Code | Property Name in Notion UI |
|---------|----------------------|---------------------------|
| Task title | `Task Name` or `Name` | "Task Name" |
| Task description | `Description` | "Description" |
| Task status | `Status` | "Status" |
| Parent relation | `Parent item` | "Parent item" |
| Child relation | `Sub-item` | "Sub-item" |
| Project relation | `Projects` | "Projects" |
| Milestone relation | `Milestones` | "Milestones" |

---

## Notes

- The Tasks database is the primary database these skills interact with
- Test sub-tasks are created as sibling records in the same Tasks database
- The hierarchy is enforced via relations, not database parent-child
- All IDs in Notion are 32-character UUIDs without dashes when used in URLs
