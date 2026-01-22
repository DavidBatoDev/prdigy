# Roadmap Canvas JSON Structure

**Version:** 2.0  
**Date:** January 21, 2026  
**Schema Reference:** [ROADMAP_CANVAS_SCHEMA.md](./ROADMAP_CANVAS_SCHEMA.md)

## Overview

This document provides comprehensive JSON structure examples for the Roadmap Canvas feature, showing how the data model looks when retrieved from the database or API.

### Key Relationships (v2.0)

```
┌────────────────────────────────────────────────────────┐
│  CONCEPTUAL MODEL                                      │
│                                                        │
│  Roadmap                                               │
│   ├── Milestones (timeline checkpoints)               │
│   │   └── Links to → Features (deliverables)          │
│   └── Epics (structural containers)                   │
│       └── Features (smallest deliverable unit)        │
│           └── Tasks (work items)                       │
│               ├── Comments                             │
│               └── Attachments                          │
└────────────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [Complete Roadmap Structure](#complete-roadmap-structure)
2. [Individual Entity Examples](#individual-entity-examples)
3. [API Response Examples](#api-response-examples)
4. [Progress Calculation Data](#progress-calculation-data)
5. [UI State Examples](#ui-state-examples)

---

## Complete Roadmap Structure

### Full Nested Example

This shows a complete roadmap with all nested relationships:

```json
{
  "roadmap": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "project_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Fitness Web App – MVP",
    "description": "Complete roadmap for launching the MVP of our fitness tracking application",
    "owner_id": "user-123",
    "status": "active",
    "start_date": "2026-02-01T00:00:00Z",
    "end_date": "2026-04-01T00:00:00Z",
    "settings": {
      "theme": "default",
      "view_mode": "milestone",
      "show_progress": true,
      "default_epic_color": "#3b82f6"
    },
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-21T14:20:00Z",
    "progress": 35.5
  },
  "milestones": [
    {
      "id": "milestone-1",
      "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Design Ready",
      "description": "All core screens designed and approved",
      "target_date": "2026-02-15T00:00:00Z",
      "completed_date": null,
      "status": "in_progress",
      "position": 0,
      "color": "#10b981",
      "created_at": "2026-01-15T10:31:00Z",
      "updated_at": "2026-01-21T14:20:00Z",
      "progress": 80.0,
      "linked_features": [
        {
          "id": "feature-1",
          "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
          "epic_id": "epic-1",
          "title": "Define app structure",
          "description": "Create basic app structure and navigation",
          "status": "completed",
          "position": 0,
          "is_deliverable": true,
          "estimated_hours": 16.0,
          "actual_hours": 14.5,
          "created_at": "2026-01-15T11:00:00Z",
          "updated_at": "2026-01-18T16:30:00Z",
          "progress": 100.0,
          "epic_info": {
            "title": "Low-Fidelity Design",
            "color": "#3b82f6",
            "tags": ["design", "ui"]
          }
        },
        {
          "id": "feature-2",
          "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
          "epic_id": "epic-1",
          "title": "Map user flows",
          "description": "Document all user journeys",
          "status": "completed",
          "position": 2,
          "is_deliverable": true,
          "estimated_hours": 12.0,
          "actual_hours": 13.0,
          "created_at": "2026-01-15T11:05:00Z",
          "updated_at": "2026-01-19T10:15:00Z",
          "progress": 100.0,
          "epic_info": {
            "title": "Low-Fidelity Design",
            "color": "#3b82f6",
            "tags": ["design", "ui"]
          }
        },
        {
          "id": "feature-3",
          "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
          "epic_id": "epic-2",
          "title": "Polish login screens",
          "description": "Final login and signup designs",
          "status": "in_progress",
          "position": 0,
          "is_deliverable": true,
          "estimated_hours": 20.0,
          "actual_hours": 12.0,
          "created_at": "2026-01-15T11:10:00Z",
          "updated_at": "2026-01-21T09:00:00Z",
          "progress": 60.0,
          "epic_info": {
            "title": "High-Fidelity Design",
            "color": "#8b5cf6",
            "tags": ["design", "ui"]
          }
        }
      ]
    },
    {
      "id": "milestone-2",
      "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Backend Ready",
      "description": "APIs stable and tested",
      "target_date": "2026-03-10T00:00:00Z",
      "completed_date": null,
      "status": "not_started",
      "position": 1,
      "color": "#f59e0b",
      "created_at": "2026-01-15T10:32:00Z",
      "updated_at": "2026-01-15T10:32:00Z",
      "progress": 0.0,
      "linked_features": []
    }
  ],
  "epics": [
    {
      "id": "epic-1",
      "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Low-Fidelity Design",
      "description": "Wireframes and basic layouts",
      "priority": "high",
      "status": "completed",
      "position": 0,
      "color": "#3b82f6",
      "estimated_hours": 40.0,
      "actual_hours": 38.5,
      "start_date": "2026-01-16T00:00:00Z",
      "due_date": "2026-02-10T00:00:00Z",
      "completed_date": "2026-01-19T17:00:00Z",
      "tags": ["design", "ui"],
      "created_at": "2026-01-15T10:45:00Z",
      "updated_at": "2026-01-19T17:00:00Z",
      "progress": 100.0,
      "features": [
        {
          "id": "feature-1",
          "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
          "epic_id": "epic-1",
          "title": "Define app structure",
          "description": "Create basic app structure and navigation",
          "status": "completed",
          "position": 0,
          "is_deliverable": true,
          "estimated_hours": 16.0,
          "actual_hours": 14.5,
          "created_at": "2026-01-15T11:00:00Z",
          "updated_at": "2026-01-18T16:30:00Z",
          "progress": 100.0,
          "milestone_links": ["milestone-1"],
          "tasks": [
            {
              "id": "task-1",
              "feature_id": "feature-1",
              "title": "Create login screen wireframe",
              "description": "Design the login page layout",
              "assignee_id": "user-456",
              "reporter_id": "user-123",
              "status": "done",
              "priority": "high",
              "position": 0,
              "estimated_hours": 4.0,
              "actual_hours": 3.5,
              "due_date": "2026-01-17T00:00:00Z",
              "completed_at": "2026-01-17T14:30:00Z",
              "labels": ["wireframe", "auth"],
              "checklist": [
                {
                  "id": "check-1",
                  "text": "Sketch initial layout",
                  "completed": true
                },
                {
                  "id": "check-2",
                  "text": "Add form validation states",
                  "completed": true
                }
              ],
              "created_at": "2026-01-15T11:15:00Z",
              "updated_at": "2026-01-17T14:30:00Z",
              "assignee": {
                "id": "user-456",
                "display_name": "Jane Designer",
                "avatar_url": "https://example.com/avatars/jane.jpg"
              }
            },
            {
              "id": "task-2",
              "feature_id": "feature-1",
              "title": "Create dashboard wireframe",
              "description": "Design the main dashboard layout",
              "assignee_id": "user-456",
              "reporter_id": "user-123",
              "status": "done",
              "priority": "high",
              "position": 1,
              "estimated_hours": 6.0,
              "actual_hours": 5.5,
              "due_date": "2026-01-18T00:00:00Z",
              "completed_at": "2026-01-18T11:20:00Z",
              "labels": ["wireframe", "dashboard"],
              "checklist": [],
              "created_at": "2026-01-15T11:16:00Z",
              "updated_at": "2026-01-18T11:20:00Z",
              "assignee": {
                "id": "user-456",
                "display_name": "Jane Designer",
                "avatar_url": "https://example.com/avatars/jane.jpg"
              }
            }
          ]
        },
        {
          "id": "feature-2",
          "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
          "epic_id": "epic-1",
          "title": "Map user flows",
          "description": "Document all user journeys",
          "status": "completed",
          "position": 2,
          "is_deliverable": true,
          "estimated_hours": 12.0,
          "actual_hours": 13.0,
          "created_at": "2026-01-15T11:05:00Z",
          "updated_at": "2026-01-19T10:15:00Z",
          "progress": 100.0,
          "milestone_links": ["milestone-1"],
          "tasks": []
        }
      ]
    },
    {
      "id": "epic-2",
      "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "High-Fidelity Design",
      "description": "Final polished designs",
      "priority": "high",
      "status": "in_progress",
      "position": 1,
      "color": "#8b5cf6",
      "estimated_hours": 60.0,
      "actual_hours": 24.0,
      "start_date": "2026-01-19T00:00:00Z",
      "due_date": "2026-02-15T00:00:00Z",
      "completed_date": null,
      "tags": ["design", "ui"],
      "created_at": "2026-01-15T10:46:00Z",
      "updated_at": "2026-01-21T09:00:00Z",
      "progress": 40.0,
      "features": [
        {
          "id": "feature-3",
          "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
          "epic_id": "epic-2",
          "title": "Polish login screens",
          "description": "Final login and signup designs",
          "status": "in_progress",
          "position": 0,
          "is_deliverable": true,
          "estimated_hours": 20.0,
          "actual_hours": 12.0,
          "created_at": "2026-01-15T11:10:00Z",
          "updated_at": "2026-01-21T09:00:00Z",
          "progress": 60.0,
          "milestone_links": ["milestone-1"],
          "tasks": []
        }
      ]
    }
  ]
}
```

---

## Individual Entity Examples

### Roadmap

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Fitness Web App – MVP",
  "description": "Complete roadmap for launching the MVP of our fitness tracking application",
  "owner_id": "user-123",
  "status": "active",
  "start_date": "2026-02-01T00:00:00Z",
  "end_date": "2026-04-01T00:00:00Z",
  "settings": {
    "theme": "default",
    "view_mode": "milestone",
    "show_progress": true,
    "default_epic_color": "#3b82f6"
  },
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-21T14:20:00Z"
}
```

### Milestone

```json
{
  "id": "milestone-1",
  "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Design Ready",
  "description": "All core screens designed and approved",
  "target_date": "2026-02-15T00:00:00Z",
  "completed_date": null,
  "status": "in_progress",
  "position": 0,
  "color": "#10b981",
  "created_at": "2026-01-15T10:31:00Z",
  "updated_at": "2026-01-21T14:20:00Z"
}
```

### Epic

```json
{
  "id": "epic-1",
  "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Low-Fidelity Design",
  "description": "Wireframes and basic layouts",
  "priority": "high",
  "status": "completed",
  "position": 0,
  "color": "#3b82f6",
  "estimated_hours": 40.0,
  "actual_hours": 38.5,
  "start_date": "2026-01-16T00:00:00Z",
  "due_date": "2026-02-10T00:00:00Z",
  "completed_date": "2026-01-19T17:00:00Z",
  "tags": ["design", "ui"],
  "created_at": "2026-01-15T10:45:00Z",
  "updated_at": "2026-01-19T17:00:00Z"
}
```

### Feature (v2.0)

```json
{
  "id": "feature-1",
  "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
  "epic_id": "epic-1",
  "title": "Define app structure",
  "description": "Create basic app structure and navigation",
  "status": "completed",
  "position": 0,
  "is_deliverable": true,
  "estimated_hours": 16.0,
  "actual_hours": 14.5,
  "created_at": "2026-01-15T11:00:00Z",
  "updated_at": "2026-01-18T16:30:00Z"
}
```

### Milestone-Feature Link (v2.0)

```json
{
  "id": "mf-link-1",
  "milestone_id": "milestone-1",
  "feature_id": "feature-1",
  "position": 0,
  "created_at": "2026-01-15T11:30:00Z"
}
```

### Task

```json
{
  "id": "task-1",
  "feature_id": "feature-1",
  "title": "Create login screen wireframe",
  "description": "Design the login page layout",
  "assignee_id": "user-456",
  "reporter_id": "user-123",
  "status": "done",
  "priority": "high",
  "position": 0,
  "estimated_hours": 4.0,
  "actual_hours": 3.5,
  "due_date": "2026-01-17T00:00:00Z",
  "completed_at": "2026-01-17T14:30:00Z",
  "labels": ["wireframe", "auth"],
  "checklist": [
    {
      "id": "check-1",
      "text": "Sketch initial layout",
      "completed": true
    },
    {
      "id": "check-2",
      "text": "Add form validation states",
      "completed": true
    }
  ],
  "created_at": "2026-01-15T11:15:00Z",
  "updated_at": "2026-01-17T14:30:00Z"
}
```

### Task Comment

```json
{
  "id": "comment-1",
  "task_id": "task-1",
  "author_id": "user-789",
  "content": "Great work on this! I left a few comments in Figma for small tweaks.",
  "edited_at": null,
  "created_at": "2026-01-17T16:45:00Z"
}
```

### Task Attachment

```json
{
  "id": "attachment-1",
  "task_id": "task-1",
  "uploaded_by": "user-456",
  "file_name": "login-wireframe-v3.fig",
  "file_url": "https://storage.example.com/attachments/login-wireframe-v3.fig",
  "file_size": 2457600,
  "mime_type": "application/octet-stream",
  "created_at": "2026-01-17T12:30:00Z"
}
```

---

## API Response Examples

### GET /api/roadmaps/:roadmap_id

**Complete roadmap with nested milestones and epics:**

```json
{
  "success": true,
  "data": {
    "roadmap": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "project_id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Fitness Web App – MVP",
      "description": "Complete roadmap for launching the MVP of our fitness tracking application",
      "owner_id": "user-123",
      "status": "active",
      "start_date": "2026-02-01T00:00:00Z",
      "end_date": "2026-04-01T00:00:00Z",
      "settings": {
        "theme": "default",
        "view_mode": "milestone",
        "show_progress": true
      },
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-21T14:20:00Z",
      "progress": 35.5
    },
    "milestones": [
      {
        "id": "milestone-1",
        "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Design Ready",
        "target_date": "2026-02-15T00:00:00Z",
        "status": "in_progress",
        "position": 0,
        "progress": 80.0,
        "linked_feature_count": 3
      }
    ],
    "epics": [
      {
        "id": "epic-1",
        "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Low-Fidelity Design",
        "priority": "high",
        "status": "completed",
        "position": 0,
        "progress": 100.0,
        "feature_count": 3
      }
    ]
  }
}
```

### GET /api/milestones/:milestone_id/features

**Features linked to a milestone (v2.0):**

```json
{
  "success": true,
  "data": {
    "milestone": {
      "id": "milestone-1",
      "title": "Design Ready",
      "target_date": "2026-02-15T00:00:00Z",
      "progress": 80.0
    },
    "features": [
      {
        "id": "feature-1",
        "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
        "epic_id": "epic-1",
        "title": "Define app structure",
        "status": "completed",
        "is_deliverable": true,
        "progress": 100.0,
        "epic": {
          "id": "epic-1",
          "title": "Low-Fidelity Design",
          "color": "#3b82f6",
          "tags": ["design", "ui"]
        },
        "task_summary": {
          "total": 3,
          "completed": 3,
          "in_progress": 0,
          "todo": 0
        }
      },
      {
        "id": "feature-3",
        "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
        "epic_id": "epic-2",
        "title": "Polish login screens",
        "status": "in_progress",
        "is_deliverable": true,
        "progress": 60.0,
        "epic": {
          "id": "epic-2",
          "title": "High-Fidelity Design",
          "color": "#8b5cf6",
          "tags": ["design", "ui"]
        },
        "task_summary": {
          "total": 5,
          "completed": 2,
          "in_progress": 2,
          "todo": 1
        }
      }
    ]
  }
}
```

### GET /api/epics/:epic_id/features

**Features within an epic:**

```json
{
  "success": true,
  "data": {
    "epic": {
      "id": "epic-1",
      "title": "Low-Fidelity Design",
      "status": "completed",
      "progress": 100.0
    },
    "features": [
      {
        "id": "feature-1",
        "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
        "epic_id": "epic-1",
        "title": "Define app structure",
        "status": "completed",
        "position": 0,
        "is_deliverable": true,
        "progress": 100.0,
        "milestone_count": 1,
        "task_count": 3
      },
      {
        "id": "feature-2",
        "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
        "epic_id": "epic-1",
        "title": "Map user flows",
        "status": "completed",
        "position": 2,
        "is_deliverable": true,
        "progress": 100.0,
        "milestone_count": 1,
        "task_count": 2
      }
    ]
  }
}
```

### POST /api/features

**Create a new feature:**

**Request:**

```json
{
  "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
  "epic_id": "epic-1",
  "title": "Create settings page wireframe",
  "description": "Design user settings and preferences interface",
  "status": "not_started",
  "position": 3,
  "is_deliverable": true,
  "estimated_hours": 8.0
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "feature-4",
    "roadmap_id": "550e8400-e29b-41d4-a716-446655440000",
    "epic_id": "epic-1",
    "title": "Create settings page wireframe",
    "description": "Design user settings and preferences interface",
    "status": "not_started",
    "position": 3,
    "is_deliverable": true,
    "estimated_hours": 8.0,
    "actual_hours": null,
    "created_at": "2026-01-21T15:30:00Z",
    "updated_at": "2026-01-21T15:30:00Z"
  }
}
```

### POST /api/milestone-features

**Link a feature to a milestone (v2.0):**

**Request:**

```json
{
  "milestone_id": "milestone-1",
  "feature_id": "feature-4",
  "position": 3
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "mf-link-4",
    "milestone_id": "milestone-1",
    "feature_id": "feature-4",
    "position": 3,
    "created_at": "2026-01-21T15:31:00Z"
  }
}
```

---

## Progress Calculation Data

### GET /api/roadmaps/:roadmap_id/progress

**Hierarchical progress with all levels:**

```json
{
  "success": true,
  "data": {
    "roadmap": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Fitness Web App – MVP",
      "overall_progress": 35.5
    },
    "milestones": [
      {
        "id": "milestone-1",
        "title": "Design Ready",
        "progress": 80.0,
        "features": [
          {
            "id": "feature-1",
            "title": "Define app structure",
            "progress": 100.0,
            "tasks": [
              {
                "id": "task-1",
                "title": "Create login screen wireframe",
                "status": "done",
                "progress": 100
              },
              {
                "id": "task-2",
                "title": "Create dashboard wireframe",
                "status": "done",
                "progress": 100
              }
            ]
          },
          {
            "id": "feature-3",
            "title": "Polish login screens",
            "progress": 60.0,
            "tasks": [
              {
                "id": "task-5",
                "title": "Final login design",
                "status": "done",
                "progress": 100
              },
              {
                "id": "task-6",
                "title": "Final signup design",
                "status": "in_progress",
                "progress": 25
              }
            ]
          }
        ]
      },
      {
        "id": "milestone-2",
        "title": "Backend Ready",
        "progress": 0.0,
        "features": []
      }
    ],
    "epics": [
      {
        "id": "epic-1",
        "title": "Low-Fidelity Design",
        "progress": 100.0,
        "feature_count": 3,
        "completed_features": 3
      },
      {
        "id": "epic-2",
        "title": "High-Fidelity Design",
        "progress": 40.0,
        "feature_count": 2,
        "completed_features": 0
      }
    ]
  }
}
```

---

## UI State Examples

### Milestone View State

```json
{
  "viewMode": "milestone",
  "selectedMilestoneId": "milestone-1",
  "selectedFeatureId": null,
  "selectedTaskId": null,
  "sidePanelOpen": true,
  "sidePanelContent": "details",
  "filters": {
    "epic_ids": [],
    "statuses": [],
    "assignees": []
  },
  "sort": {
    "field": "position",
    "direction": "asc"
  }
}
```

### Hierarchy View State

```json
{
  "viewMode": "hierarchy",
  "selectedEpicId": "epic-1",
  "selectedFeatureId": "feature-1",
  "selectedTaskId": "task-1",
  "sidePanelOpen": true,
  "sidePanelContent": "comments",
  "expandedNodes": {
    "epics": ["epic-1", "epic-2"],
    "features": ["feature-1", "feature-3"],
    "tasks": []
  },
  "filters": {
    "milestone_ids": ["milestone-1"],
    "show_non_deliverable": false
  }
}
```

---

## TypeScript Type Mapping

All JSON structures correspond to the TypeScript types defined in `web/src/types/roadmap.ts`:

| JSON Key             | TypeScript Type          | Notes                                    |
| -------------------- | ------------------------ | ---------------------------------------- |
| `roadmap`            | `Roadmap`                | Top-level container                      |
| `milestones`         | `RoadmapMilestone[]`     | Timeline checkpoints                     |
| `epics`              | `RoadmapEpic[]`          | Structural containers                    |
| `features`           | `RoadmapFeature[]`       | Smallest deliverable unit (v2.0)         |
| `milestone_features` | `MilestoneFeatureLink[]` | Junction table (v2.0)                    |
| `tasks`              | `RoadmapTask[]`          | Work items                               |
| `comments`           | `TaskComment[]`          | Task discussions                         |
| `attachments`        | `TaskAttachment[]`       | File attachments                         |
| `checklist`          | `ChecklistItem[]`        | Task subtasks                            |
| `progress`           | `number`                 | Calculated 0-100 percentage              |
| `is_deliverable`     | `boolean`                | v2.0: Whether feature counts in progress |

---

## Key Differences from v1.0

### ❌ Old v1.0 Structure (Deprecated)

```json
{
  "milestone": {
    "id": "milestone-1",
    "linked_epics": [
      {
        "id": "epic-1",
        "features": [...]
      }
    ]
  }
}
```

### ✅ New v2.0 Structure (Current)

```json
{
  "milestone": {
    "id": "milestone-1",
    "linked_features": [
      {
        "id": "feature-1",
        "epic_id": "epic-1",
        "epic_info": {
          "title": "Low-Fidelity Design",
          "color": "#3b82f6"
        }
      }
    ]
  }
}
```

**Why:** Features are the smallest deliverable unit. This enables:

- Partial epic delivery across milestones
- Accurate progress tracking
- Better alignment with value-based delivery

---

## Query Examples

### Get all features for a milestone (with epic info)

```sql
SELECT
  f.*,
  e.title as epic_title,
  e.color as epic_color,
  e.tags as epic_tags
FROM milestone_features mf
JOIN roadmap_features f ON f.id = mf.feature_id
JOIN roadmap_epics e ON e.id = f.epic_id
WHERE mf.milestone_id = 'milestone-1'
ORDER BY mf.position;
```

### Get all milestones a feature contributes to

```sql
SELECT
  m.*,
  mf.position
FROM milestone_features mf
JOIN roadmap_milestones m ON m.id = mf.milestone_id
WHERE mf.feature_id = 'feature-1'
ORDER BY m.target_date;
```

---

## Best Practices

1. **Always include `is_deliverable`** when creating features
2. **Use `epic_info` for display** instead of joining epics repeatedly
3. **Cache progress calculations** - they can be expensive on large roadmaps
4. **Paginate task lists** - features can have 50+ tasks
5. **Use position fields** for drag-and-drop ordering
6. **Validate milestone links** - ensure features belong to the same roadmap

---

## References

- [Database Schema Documentation](./ROADMAP_CANVAS_SCHEMA.md)
- [TypeScript Type Definitions](../web/src/types/roadmap.ts)
- [Migration v2.0](../supabase/migrations/20260121000000_upgrade_roadmap_to_v2.sql)
