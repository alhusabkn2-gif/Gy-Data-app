-- Match existing pattern: open policies for anon (app uses anon key)
CREATE POLICY "anon_insert_cashback_settings" ON cashback_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_cashback_settings" ON cashback_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_cashback_settings" ON cashback_settings FOR DELETE
  TO anon, authenticated USING (true);

CREATE POLICY "anon_select_cashback_tx" ON cashback_transactions FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_cashback_tx" ON cashback_transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_cashback_tx" ON cashback_transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_cashback_tx" ON cashback_transactions FOR DELETE
  TO anon, authenticated USING (true);
