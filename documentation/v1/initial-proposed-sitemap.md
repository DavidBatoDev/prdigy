---
# Initial Proposed Sitemap

This is a major restructuring of the app, moving from rigid roles to a Unified Hub/Persona-Based System. It incorporates the new concepts (Client, Consultant, Persona-Based Dashboard, Linear Roadmap, IAM Policy Engine, Escrow), removes the old rigid roles, and ensures consistent numbering.

---

## 🎨 Design legend

- **Public / Auth:** Neutral Gray (#64748B)
- **Persona Hub (Main Hub):** Professional Blue (#2563EB)
- **Project Instance:** Success Green (#059669)
- **Admin:** System Red (#E11D48)

---

## 1.0 Public / Authentication layer (Gray #64748B)

1. **Public / Authentication (Entry)**
	 - 1.1 **Landing page**
		 - `GET /become-a-consultant`
		 - `GET /pricing`
	 - 1.2 **Auth pages**
		 - `GET /auth/login` (SSO)
			 - Forgot password (modal)
			 - Reset password (modal)
		 - `GET /auth/register`
		 - `GET /auth/onboarding` (Step 1: choose intent)
			 - Option A: **"I want to Hire Talent"** — sets view to Client persona → redirects to **2.2**
			 - Option B: **"I want to Find Work"** — sets view to Freelancer persona → redirects to **2.3**
	 - 1.3 **Legal pages**
		 - Terms of Service
		 - Privacy Policy

> On successful SSO the user routes to `/dashboard` (section 2.1).

---

## 2.0 The Main Hub (Unified Persona Dashboard) (Blue #2563EB)

2.0 **The Main Hub** (Canva-style dashboard)

- 2.1 **`/dashboard` (Home)**
	- Widget: Active Projects
	- Widget: Meeting Agenda
	- Widget: Notifications / Inbox
- 2.2 **Client persona: Project proposal**
	- `POST /dashboard/propose` (wizard)
		- Step 1: Vision & scope
		- Step 2: Budget & timeline
		- Step 3: AI assistant refinement
- 2.3 **Freelancer persona: Job search**
	- `GET /dashboard/jobs` — browse open roles, view applications
- 2.4 **Consultant persona: Management (restricted)**
	- `/dashboard/consultant-hub` — my talent pool, incoming requests, financial overview (escrow)
- 2.5 **User settings**
	- General (avatar, bio)
	- Role management & verification (enter invite code / apply as consultant)
	- Billing & payout methods
- 2.6 **Logout**

---

## 3.0 The Project Instance (Green #059669)

3.0 **Project** (per `project/{id}`)

- 3.1 **`/project/{id}/overview`**
	- Project health summary
	- Project charter (vision & goals)
- 3.2 **`/project/{id}/roadmap` (Core)**
	- View: Full timeline (Gantt)
	- View: Phase board (Kanban)
	- Actions: create phase, edit milestone, post update card
	- Sidebar: AI roadmap assistant
- 3.3 **`/project/{id}/calendar`** — weekly/monthly view; book meeting (dynamic logo picker)
- 3.4 **`/project/{id}/communications`**
	- `/all-hands` (Client + Consultant + Freelancers)
	- `/dev-team` (Consultant + Freelancers)
	- `/direct/{user_id}` (1:1)
	- Automated stand-up bot
- 3.5 **`/project/{id}/people` (IAM)**
	- Team roster
	- Permissions engine (owner/consultant only)
	- Actions: create custom role, assign policies
- 3.6 **`/project/{id}/files`** — folders for designs, contracts, builds; simple versioning
- 3.7 **`/project/{id}/payments`** — milestone escrow & cascade payment audit; wallet
- 3.8 **`/project/{id}/settings`** — status (active/paused/archived), dispute/escalation

---

## 4.0 Admin portal (Red #E11D48)

- 4.1 **`/admin/dashboard`**
- 4.2 **`/admin/users`**
	- Consultants (vetting queue) — review applications, approve/reject
	- Global user list
- 4.3 **`/admin/projects`** — global project list, assign consultant (matchmaking)
- 4.4 **`/admin/finance`** — platform revenue, escrow audits
- 4.5 **Logout**

---

*If you'd like, I can generate a visual sitemap (Mermaid or PlantUML), add anchors/TOC, or export this to a README-ready file.*

