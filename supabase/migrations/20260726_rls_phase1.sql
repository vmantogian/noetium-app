-- 20260726_rls_phase1.sql
-- Phase 1 RLS hardening. REVIEW BEFORE APPLYING. Run in a staging copy first.
--
-- Context: an audit of pg_policies and pg_class found:
--   * 10 tables with RLS disabled entirely. In Supabase the anon and
--     authenticated roles are GRANTed access to public schema tables by
--     default, so RLS disabled means anyone holding the anon key -- which
--     ships publicly in the browser bundle -- can READ AND WRITE those tables.
--   * 7 policies granted to the `public` role with USING (true), making the
--     data readable with no login at all.
--
-- This file fixes the reference tables and the anonymous-read exposure.
-- It deliberately does NOT touch the per-student tables or the nine
-- policy-less tables, because those need owner column names that were
-- missing from the truncated schema_tables dump. See the TODO block at the end.

begin;

-- ---------------------------------------------------------------------------
-- PART 1: reference/lookup tables.
-- These are seeded content, not user data. The exposure here is not privacy,
-- it is integrity: with RLS off, any holder of the anon key can DELETE or
-- rewrite them. Enable RLS, allow authenticated reads, and let writes happen
-- only through the service role (which bypasses RLS).
-- ---------------------------------------------------------------------------

alter table public.academic_calendar              enable row level security;
alter table public.curriculum_notification_rules  enable row level security;
alter table public.curriculum_weekly_content      enable row level security;
alter table public.enrichment_subject_connections enable row level security;
alter table public.grade_levels                   enable row level security;
alter table public.grade_subject_schedule         enable row level security;
alter table public.subjects                       enable row level security;

drop policy if exists "read_academic_calendar"              on public.academic_calendar;
drop policy if exists "read_curriculum_notification_rules"  on public.curriculum_notification_rules;
drop policy if exists "read_curriculum_weekly_content"      on public.curriculum_weekly_content;
drop policy if exists "read_enrichment_subject_connections" on public.enrichment_subject_connections;
drop policy if exists "read_grade_levels"                   on public.grade_levels;
drop policy if exists "read_grade_subject_schedule"         on public.grade_subject_schedule;
drop policy if exists "read_subjects"                       on public.subjects;

create policy "read_academic_calendar"              on public.academic_calendar              for select to authenticated using (true);
create policy "read_curriculum_notification_rules"  on public.curriculum_notification_rules  for select to authenticated using (true);
create policy "read_curriculum_weekly_content"      on public.curriculum_weekly_content      for select to authenticated using (true);
create policy "read_enrichment_subject_connections" on public.enrichment_subject_connections for select to authenticated using (true);
create policy "read_grade_levels"                   on public.grade_levels                   for select to authenticated using (true);
create policy "read_grade_subject_schedule"         on public.grade_subject_schedule         for select to authenticated using (true);
create policy "read_subjects"                       on public.subjects                       for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- PART 2: close anonymous read access.
-- These policies are granted TO public with USING (true), so they are readable
-- with no session at all. debate_arguments and debates hold content WRITTEN BY
-- CHILDREN, which must never be world-readable. educational_content is the
-- 1.5M-chunk corpus -- the core asset of the product -- currently enumerable
-- by anyone who lifts the anon key out of the JS bundle.
--
-- This step narrows them from `public` to `authenticated`. That is a floor,
-- not a finished state: see TODO 3.
-- ---------------------------------------------------------------------------

drop policy if exists "view_arguments"                          on public.debate_arguments;
drop policy if exists "view_participants"                       on public.debate_participants;
drop policy if exists "view_debates"                            on public.debates;
drop policy if exists "public_topics"                           on public.debate_topics;
drop policy if exists "public_exercises"                        on public.mindfulness_exercises;
drop policy if exists "Educational content is readable by all"  on public.educational_content;
drop policy if exists "Visual library is publicly readable"     on public.visual_library;

create policy "view_arguments"        on public.debate_arguments      for select to authenticated using (true);
create policy "view_participants"     on public.debate_participants   for select to authenticated using (true);
create policy "view_debates"          on public.debates               for select to authenticated using (true);
create policy "public_topics"         on public.debate_topics         for select to authenticated using (true);
create policy "public_exercises"      on public.mindfulness_exercises for select to authenticated using (true);
create policy "read_educational_content" on public.educational_content for select to authenticated using (true);
create policy "read_visual_library"      on public.visual_library      for select to authenticated using (true);

commit;

-- ---------------------------------------------------------------------------
-- TODO -- phase 2, blocked on the full column dump
-- ---------------------------------------------------------------------------
-- 1. Per-student tables still have RLS DISABLED. Every student's rows are
--    readable and writable by any anon-key holder:
--       student_curriculum_progress
--       student_notification_preferences
--       curriculum_notifications_sent
--    Needs the owning user column to scope with auth.uid().
--
-- 2. Nine tables have RLS ENABLED but ZERO policies, which denies all access
--    to anon and authenticated (service_role still bypasses). Any feature
--    reading these through the browser client is silently broken today:
--       artifact_files, debate_evaluations, debate_match_queue, learning_goals,
--       peer_feedback, reflections, rubric_scores, self_assessments,
--       teacher_feedback
--
-- 3. rubrics has "Authenticated users can update rubrics" with USING (true)
--    AND WITH CHECK (true), so ANY logged-in user -- including a student --
--    can modify ANY teacher's rubric. Needs an owner column to scope.
--
-- 4. Debate tables should ultimately be scoped to participants rather than
--    all authenticated users, once the participant join column is known.