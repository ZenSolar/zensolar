
-- Create is_admin_or_editor function
CREATE OR REPLACE FUNCTION public.is_admin_or_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'editor')
  )
$$;

-- announcements
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admins and editors can delete announcements" ON public.announcements FOR DELETE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
CREATE POLICY "Admins and editors can insert announcements" ON public.announcements FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
CREATE POLICY "Admins and editors can update announcements" ON public.announcements FOR UPDATE USING (is_admin_or_editor(auth.uid()));

-- feedback
DROP POLICY IF EXISTS "Admins can delete feedback" ON public.feedback;
CREATE POLICY "Admins and editors can delete feedback" ON public.feedback FOR DELETE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback;
CREATE POLICY "Admins and editors can update feedback" ON public.feedback FOR UPDATE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
CREATE POLICY "Admins and editors can view all feedback" ON public.feedback FOR SELECT USING (is_admin_or_editor(auth.uid()));

-- support_requests
DROP POLICY IF EXISTS "Admins can update support requests" ON public.support_requests;
CREATE POLICY "Admins and editors can update support requests" ON public.support_requests FOR UPDATE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all support requests" ON public.support_requests;
CREATE POLICY "Admins and editors can view all support requests" ON public.support_requests FOR SELECT USING (is_admin_or_editor(auth.uid()));

-- notification_templates
DROP POLICY IF EXISTS "Admins can delete templates" ON public.notification_templates;
CREATE POLICY "Admins and editors can delete templates" ON public.notification_templates FOR DELETE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert templates" ON public.notification_templates;
CREATE POLICY "Admins and editors can insert templates" ON public.notification_templates FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can update templates" ON public.notification_templates;
CREATE POLICY "Admins and editors can update templates" ON public.notification_templates FOR UPDATE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can view templates" ON public.notification_templates;
CREATE POLICY "Admins and editors can view templates" ON public.notification_templates FOR SELECT USING (is_admin_or_editor(auth.uid()));

-- work_journal
DROP POLICY IF EXISTS "Admins can delete journal entries" ON public.work_journal;
CREATE POLICY "Admins and editors can delete journal entries" ON public.work_journal FOR DELETE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert journal entries" ON public.work_journal;
CREATE POLICY "Admins and editors can insert journal entries" ON public.work_journal FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()) AND (auth.uid() = created_by));

DROP POLICY IF EXISTS "Admins can update journal entries" ON public.work_journal;
CREATE POLICY "Admins and editors can update journal entries" ON public.work_journal FOR UPDATE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can view journal entries" ON public.work_journal;
CREATE POLICY "Admins and editors can view journal entries" ON public.work_journal FOR SELECT USING (is_admin_or_editor(auth.uid()));

-- work_journal_summaries
DROP POLICY IF EXISTS "Admins can delete summaries" ON public.work_journal_summaries;
CREATE POLICY "Admins and editors can delete summaries" ON public.work_journal_summaries FOR DELETE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert summaries" ON public.work_journal_summaries;
CREATE POLICY "Admins and editors can insert summaries" ON public.work_journal_summaries FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()) AND (auth.uid() = created_by));

DROP POLICY IF EXISTS "Admins can update summaries" ON public.work_journal_summaries;
CREATE POLICY "Admins and editors can update summaries" ON public.work_journal_summaries FOR UPDATE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can view summaries" ON public.work_journal_summaries;
CREATE POLICY "Admins and editors can view summaries" ON public.work_journal_summaries FOR SELECT USING (is_admin_or_editor(auth.uid()));

-- work_journal_snapshots_schema
DROP POLICY IF EXISTS "Service role only" ON public.work_journal_snapshots_schema;
CREATE POLICY "Admins and editors can manage snapshots" ON public.work_journal_snapshots_schema FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

-- seo_tasks
DROP POLICY IF EXISTS "Admins can delete seo tasks" ON public.seo_tasks;
CREATE POLICY "Admins and editors can delete seo tasks" ON public.seo_tasks FOR DELETE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert seo tasks" ON public.seo_tasks;
CREATE POLICY "Admins and editors can insert seo tasks" ON public.seo_tasks FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can update seo tasks" ON public.seo_tasks;
CREATE POLICY "Admins and editors can update seo tasks" ON public.seo_tasks FOR UPDATE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can view seo tasks" ON public.seo_tasks;
CREATE POLICY "Admins and editors can view seo tasks" ON public.seo_tasks FOR SELECT USING (is_admin_or_editor(auth.uid()));

-- yc_application_content
DROP POLICY IF EXISTS "Admins can delete yc content" ON public.yc_application_content;
CREATE POLICY "Admins and editors can delete yc content" ON public.yc_application_content FOR DELETE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert yc content" ON public.yc_application_content;
CREATE POLICY "Admins and editors can insert yc content" ON public.yc_application_content FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can update yc content" ON public.yc_application_content;
CREATE POLICY "Admins and editors can update yc content" ON public.yc_application_content FOR UPDATE USING (is_admin_or_editor(auth.uid()));

-- tokenomics_framework_responses
DROP POLICY IF EXISTS "Admins can delete framework responses" ON public.tokenomics_framework_responses;
CREATE POLICY "Admins and editors can delete framework responses" ON public.tokenomics_framework_responses FOR DELETE USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert framework responses" ON public.tokenomics_framework_responses;
CREATE POLICY "Admins and editors can insert framework responses" ON public.tokenomics_framework_responses FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()) AND (auth.uid() = user_id));

DROP POLICY IF EXISTS "Admins can update framework responses" ON public.tokenomics_framework_responses;
CREATE POLICY "Admins and editors can update framework responses" ON public.tokenomics_framework_responses FOR UPDATE USING (is_admin_or_editor(auth.uid()) AND (auth.uid() = user_id));

DROP POLICY IF EXISTS "Admins can view all framework responses" ON public.tokenomics_framework_responses;
CREATE POLICY "Admins and editors can view all framework responses" ON public.tokenomics_framework_responses FOR SELECT USING (is_admin_or_editor(auth.uid()));

-- beta_signups (view only)
DROP POLICY IF EXISTS "Admins can view beta signups" ON public.beta_signups;
CREATE POLICY "Admins and editors can view beta signups" ON public.beta_signups FOR SELECT USING (is_admin_or_editor(auth.uid()));

-- connected_devices (view all)
DROP POLICY IF EXISTS "Admins can view all devices" ON public.connected_devices;
CREATE POLICY "Admins and editors can view all devices" ON public.connected_devices FOR SELECT USING (is_admin_or_editor(auth.uid()));

-- mint_transactions (view all)
DROP POLICY IF EXISTS "Admins can view all mint transactions" ON public.mint_transactions;
CREATE POLICY "Admins and editors can view all mint transactions" ON public.mint_transactions FOR SELECT USING (is_admin_or_editor(auth.uid()));

-- profiles (view all)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins and editors can view all profiles" ON public.profiles FOR SELECT USING (is_admin_or_editor(auth.uid()));
