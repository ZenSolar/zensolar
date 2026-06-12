
CREATE POLICY "Users update own analyses" ON public.deason_doc_analyses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert own progression" ON public.deason_progression
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progression" ON public.deason_progression
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert own weather cache" ON public.deason_weather_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own weather cache" ON public.deason_weather_cache
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own weather cache" ON public.deason_weather_cache
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own pin row" ON public.founder_pins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
