# Database Tables Reference

**Generated:** December 29, 2025  
**Source:** Supabase Local Database

This document provides a quick reference for all database tables in the Prdigy application.

---

## Tables Overview

1. [profiles](#profiles) - User profile information
2. [projects](#projects) - Main project records
3. [project_members](#project_members) - Project team membership
4. [milestones](#milestones) - Project milestones
5. [work_items](#work_items) - Tasks and deliverables
6. [payment_checkpoints](#payment_checkpoints) - Payment tracking
7. [files](#files) - File storage and versioning
8. [meetings](#meetings) - Scheduled meetings
9. [chat_messages](#chat_messages) - Project communication
10. [password_resets](#password_resets) - Password reset tokens

---

## profiles

User profile information linked to authentication.

| Column                     | Type                    | Description                                            |
| -------------------------- | ----------------------- | ------------------------------------------------------ |
| `id`                       | uuid (PK)               | User ID, references `auth.users.id`                    |
| `email`                    | text (unique, not null) | User email address                                     |
| `display_name`             | text                    | Display name                                           |
| `avatar_url`               | text                    | Profile picture URL                                    |
| `first_name`               | text                    | User's first name                                      |
| `last_name`                | text                    | User's last name                                       |
| `bio`                      | text                    | User biography                                         |
| `gender`                   | text                    | User's gender                                          |
| `phone_number`             | text                    | Contact phone number                                   |
| `country`                  | text                    | Country of residence                                   |
| `city`                     | text                    | City of residence                                      |
| `zip_code`                 | text                    | Postal code                                            |
| `date_of_birth`            | date                    | Date of birth                                          |
| `is_consultant_verified`   | boolean                 | Whether user is a verified consultant (default: false) |
| `is_email_verified`        | boolean                 | Whether email is verified (default: false)             |
| `active_persona`           | persona_type            | Current active role (default: freelancer)              |
| `has_completed_onboarding` | boolean                 | Onboarding completion flag (default: false)            |
| `settings`                 | jsonb                   | User settings including onboarding data (default: {})  |
| `created_at`               | timestamptz             | Profile creation timestamp                             |
| `updated_at`               | timestamptz             | Last update timestamp                                  |

**Foreign Keys:**

- `id` → `auth.users.id` (ON DELETE CASCADE)

**Notes:**

- `settings` JSONB structure: `{"onboarding": {"intent": {"freelancer": bool, "client": bool}, "completed_at": timestamp}}`
- Has an update trigger for `updated_at`

---

## projects

Main project records.

| Column          | Type                | Description                     |
| --------------- | ------------------- | ------------------------------- |
| `id`            | uuid (PK)           | Project ID                      |
| `title`         | text (not null)     | Project title                   |
| `brief`         | text                | Project description/brief       |
| `status`        | project_status      | Current status (default: draft) |
| `client_id`     | uuid (FK, not null) | References `profiles.id`        |
| `consultant_id` | uuid (FK)           | References `profiles.id`        |
| `created_at`    | timestamptz         | Creation timestamp              |
| `updated_at`    | timestamptz         | Last update timestamp           |

**Foreign Keys:**

- `client_id` → `profiles.id` (ON DELETE CASCADE)
- `consultant_id` → `profiles.id` (ON DELETE SET NULL)

**Status Values:**

- `draft` - Initial creation
- `active` - Currently in progress
- `paused` - Temporarily halted
- `completed` - Finished
- `archived` - Archived for reference

---

## project_members

Project team membership.

| Column             | Type                | Description                      |
| ------------------ | ------------------- | -------------------------------- |
| `id`               | uuid (PK)           | Membership ID                    |
| `project_id`       | uuid (FK, not null) | References `projects.id`         |
| `user_id`          | uuid (FK, not null) | References `profiles.id`         |
| `role`             | text (not null)     | Member's role in project         |
| `permissions_json` | jsonb               | Custom permissions (default: {}) |
| `joined_at`        | timestamptz         | When member joined               |

**Foreign Keys:**

- `project_id` → `projects.id` (ON DELETE CASCADE)
- `user_id` → `profiles.id` (ON DELETE CASCADE)

**Unique Constraint:**

- `(project_id, user_id)` - One user per project

---

## milestones

Project milestones and checkpoints.

| Column        | Type                | Description                       |
| ------------- | ------------------- | --------------------------------- |
| `id`          | uuid (PK)           | Milestone ID                      |
| `project_id`  | uuid (FK, not null) | References `projects.id`          |
| `title`       | text (not null)     | Milestone title                   |
| `description` | text                | Detailed description              |
| `target_date` | timestamptz         | Target completion date            |
| `status`      | milestone_status    | Current status (default: pending) |
| `created_at`  | timestamptz         | Creation timestamp                |
| `updated_at`  | timestamptz         | Last update timestamp             |

**Foreign Keys:**

- `project_id` → `projects.id` (ON DELETE CASCADE)

**Status Values:**

- `pending`
- `in_progress`
- `completed`

---

## work_items

Individual work items, tasks, and deliverables.

| Column              | Type                      | Description                                |
| ------------------- | ------------------------- | ------------------------------------------ |
| `id`                | uuid (PK)                 | Work item ID                               |
| `project_id`        | uuid (FK, not null)       | References `projects.id`                   |
| `title`             | text (not null)           | Work item title                            |
| `description`       | text                      | Detailed description                       |
| `type`              | work_item_type (not null) | Type of work item                          |
| `status`            | work_item_status          | Current status (default: not_started)      |
| `assignee_id`       | uuid (FK)                 | References `profiles.id`                   |
| `is_client_visible` | boolean                   | Whether visible to client (default: false) |
| `due_date`          | timestamptz               | Due date                                   |
| `created_at`        | timestamptz               | Creation timestamp                         |
| `updated_at`        | timestamptz               | Last update timestamp                      |

**Foreign Keys:**

- `project_id` → `projects.id` (ON DELETE CASCADE)
- `assignee_id` → `profiles.id` (ON DELETE SET NULL)

**Type Values:**

- `deliverable`, `task`, `asset`, `issue`, `bug`, `setup`, `integration`, `design`, `development`

**Status Values:**

- `not_started`, `in_progress`, `in_review`, `completed`, `blocked`

---

## payment_checkpoints

Payment tracking for project milestones.

| Column         | Type                     | Description                       |
| -------------- | ------------------------ | --------------------------------- |
| `id`           | uuid (PK)                | Payment checkpoint ID             |
| `project_id`   | uuid (FK, not null)      | References `projects.id`          |
| `milestone_id` | uuid (FK)                | References `milestones.id`        |
| `amount`       | numeric(10,2) (not null) | Payment amount                    |
| `status`       | payment_status           | Payment status (default: pending) |
| `payer_id`     | uuid (FK, not null)      | References `profiles.id`          |
| `payee_id`     | uuid (FK, not null)      | References `profiles.id`          |
| `description`  | text                     | Payment description               |
| `completed_at` | timestamptz              | When payment was completed        |
| `created_at`   | timestamptz              | Creation timestamp                |
| `updated_at`   | timestamptz              | Last update timestamp             |

**Foreign Keys:**

- `project_id` → `projects.id` (ON DELETE CASCADE)
- `milestone_id` → `milestones.id` (ON DELETE SET NULL)
- `payer_id` → `profiles.id` (ON DELETE CASCADE)
- `payee_id` → `profiles.id` (ON DELETE CASCADE)

**Status Values:**

- `pending`
- `completed`

---

## files

File storage and version tracking.

| Column         | Type                | Description               |
| -------------- | ------------------- | ------------------------- |
| `id`           | uuid (PK)           | File ID                   |
| `project_id`   | uuid (FK, not null) | References `projects.id`  |
| `name`         | text (not null)     | File name                 |
| `storage_path` | text (not null)     | Path in storage           |
| `uploaded_by`  | uuid (FK, not null) | References `profiles.id`  |
| `version`      | integer             | File version (default: 1) |
| `file_size`    | bigint              | Size in bytes             |
| `mime_type`    | text                | MIME type                 |
| `created_at`   | timestamptz         | Upload timestamp          |
| `updated_at`   | timestamptz         | Last update timestamp     |

**Foreign Keys:**

- `project_id` → `projects.id` (ON DELETE CASCADE)
- `uploaded_by` → `profiles.id` (ON DELETE CASCADE)

---

## meetings

Scheduled meetings and calls.

| Column         | Type                    | Description               |
| -------------- | ----------------------- | ------------------------- |
| `id`           | uuid (PK)               | Meeting ID                |
| `project_id`   | uuid (FK, not null)     | References `projects.id`  |
| `title`        | text (not null)         | Meeting title             |
| `description`  | text                    | Meeting description       |
| `type`         | meeting_type (not null) | Type of meeting           |
| `scheduled_at` | timestamptz (not null)  | When meeting is scheduled |
| `meeting_url`  | text                    | Video call URL            |
| `created_by`   | uuid (FK, not null)     | References `profiles.id`  |
| `created_at`   | timestamptz             | Creation timestamp        |
| `updated_at`   | timestamptz             | Last update timestamp     |

**Foreign Keys:**

- `project_id` → `projects.id` (ON DELETE CASCADE)
- `created_by` → `profiles.id` (ON DELETE CASCADE)

**Type Values:**

- `kickoff`, `status_sync`, `design_review`, `qa`, `scope_clarification`, `retainer_sync`, `client_consultant`, `consultant_freelancer`

---

## chat_messages

Project communication messages.

| Column         | Type                    | Description                                    |
| -------------- | ----------------------- | ---------------------------------------------- |
| `id`           | uuid (PK)               | Message ID                                     |
| `project_id`   | uuid (FK, not null)     | References `projects.id`                       |
| `channel_type` | channel_type (not null) | Communication channel                          |
| `sender_id`    | uuid (FK, not null)     | References `profiles.id`                       |
| `recipient_id` | uuid (FK)               | References `profiles.id` (for direct messages) |
| `content`      | text (not null)         | Message content                                |
| `created_at`   | timestamptz             | Creation timestamp                             |
| `updated_at`   | timestamptz             | Last update timestamp                          |

**Foreign Keys:**

- `project_id` → `projects.id` (ON DELETE CASCADE)
- `sender_id` → `profiles.id` (ON DELETE CASCADE)
- `recipient_id` → `profiles.id` (ON DELETE CASCADE)

**Channel Types:**

- `all-hands` - All project members
- `dev-team` - Development team only
- `direct` - Direct messages between two users

---

## password_resets

Secure password reset token storage.

| Column        | Type                   | Description                             |
| ------------- | ---------------------- | --------------------------------------- |
| `id`          | uuid (PK)              | Reset request ID                        |
| `email`       | text (not null)        | User email                              |
| `user_id`     | uuid                   | User ID                                 |
| `code_hash`   | text (not null)        | Hashed reset code                       |
| `salt`        | text (not null)        | Salt for hashing                        |
| `expires_at`  | timestamptz (not null) | Expiration time (default: now + 10 min) |
| `consumed_at` | timestamptz            | When code was used                      |
| `created_at`  | timestamptz (not null) | Creation timestamp                      |

**Notes:**

- Stores hashed password reset codes with expiry and consumption flags
- Codes expire in 10 minutes by default

---

## Entity Relationships

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
projects (1:many) as client or consultant
    ↓
    ├── project_members (many:many with profiles)
    ├── milestones (1:many)
    │   └── payment_checkpoints (1:many)
    ├── work_items (1:many)
    ├── files (1:many)
    ├── meetings (1:many)
    └── chat_messages (1:many)
```

---

**For complete schema details including RLS policies, indexes, and functions, see:** [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
