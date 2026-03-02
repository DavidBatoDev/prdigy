-- Add assignee support to roadmap tasks
alter table public.roadmap_tasks
add column if not exists assignee_id uuid;

alter table public.roadmap_tasks
drop constraint if exists roadmap_tasks_assignee_id_fkey;

alter table public.roadmap_tasks
add constraint roadmap_tasks_assignee_id_fkey
foreign key (assignee_id)
references public.profiles(id)
on delete set null;

create index if not exists idx_roadmap_tasks_assignee_id
on public.roadmap_tasks (assignee_id);