ALTER TABLE public.project_member_time_rates
  ADD COLUMN custom_id text,
  ADD COLUMN start_date date,
  ADD COLUMN end_date date;
