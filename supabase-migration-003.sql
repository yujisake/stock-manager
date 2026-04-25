-- stock-manager migration 003
-- 取置4項目それぞれにメモ（理由・メモ欄）を追加
--
-- 対象フィールド：
--   - reserve_shop     → reserve_shop_memo
--   - reserve_online   → reserve_online_memo
--   - reserve_domestic → reserve_domestic_memo
--   - reserve_export   → reserve_export_memo
--
-- 仕様：
--   - TEXT 型、NULL 許容（未入力時は NULL）
--   - 履歴（stock_history）には記録しない（軽微な変更のため）

ALTER TABLE stock_inventory ADD COLUMN reserve_shop_memo TEXT;
ALTER TABLE stock_inventory ADD COLUMN reserve_online_memo TEXT;
ALTER TABLE stock_inventory ADD COLUMN reserve_domestic_memo TEXT;
ALTER TABLE stock_inventory ADD COLUMN reserve_export_memo TEXT;
