-- stock-manager migration 002
-- 在庫管理：不良品フィールドの細分化と破損予備の追加
--
-- 変更内容：
--   1. defective → defective_ok（不良品・見本可）にリネーム
--   2. reserve_damaged（破損予備）を追加
--   3. defective_ng（不良品・見本不可）を追加
--
-- 使える在庫の新しい計算式：
--   available = total
--             - reserve_shop
--             - reserve_online
--             - reserve_domestic
--             - reserve_export
--             - defective_ok
--             - reserve_damaged
--             - defective_ng

-- カラム名変更
ALTER TABLE stock_inventory RENAME COLUMN defective TO defective_ok;

-- 新カラム追加
ALTER TABLE stock_inventory ADD COLUMN reserve_damaged INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_inventory ADD COLUMN defective_ng INTEGER NOT NULL DEFAULT 0;
