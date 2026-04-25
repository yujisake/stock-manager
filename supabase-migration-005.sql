-- ============================================================================
-- migration-005: 確保枠3項目の追加 ＋ 修正履歴テーブル
-- ============================================================================
-- 1. stock_inventory に確保枠3列を追加
--    - reserve_frame_shop   : 売店 確保枠（出荷先未定のフリー在庫プール）
--    - reserve_frame_online : 通販 確保枠
--    - reserve_frame_liquor : 酒販 確保枠
-- 2. stock_movement の field CHECK 制約を拡張して確保枠3項目を許可
-- 3. stock_edit_history テーブルを新規作成（入庫/出荷/移動の修正履歴）
-- ============================================================================

-- 1. 確保枠3列を stock_inventory に追加
ALTER TABLE stock_inventory ADD COLUMN IF NOT EXISTS reserve_frame_shop INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_inventory ADD COLUMN IF NOT EXISTS reserve_frame_online INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_inventory ADD COLUMN IF NOT EXISTS reserve_frame_liquor INTEGER NOT NULL DEFAULT 0;

-- 2. stock_movement の field CHECK 制約を更新
ALTER TABLE stock_movement DROP CONSTRAINT IF EXISTS stock_movement_field_check;
ALTER TABLE stock_movement ADD CONSTRAINT stock_movement_field_check
  CHECK (field IN (
    'reserve_shop','reserve_online','reserve_domestic','reserve_export',
    'defective_ok','reserve_damaged','defective_ng',
    'reserve_frame_shop','reserve_frame_online','reserve_frame_liquor'
  ));

-- 3. 修正履歴テーブル
CREATE TABLE IF NOT EXISTS stock_edit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  edited_at TIMESTAMPTZ DEFAULT now(),
  edited_by TEXT,
  changes JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stock_edit_history_record ON stock_edit_history(table_name, record_id);

ALTER TABLE stock_edit_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stock_edit_history_all" ON stock_edit_history;
CREATE POLICY "stock_edit_history_all" ON stock_edit_history FOR ALL USING (true) WITH CHECK (true);
