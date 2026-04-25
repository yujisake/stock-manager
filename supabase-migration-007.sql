-- ============================================================================
-- migration-007: ソフトデリート対応
-- ============================================================================
-- 入庫・出荷・移動の3テーブルに削除フラグ用カラムを追加する。
-- 物理削除はせず deleted_at / deleted_by を立てる。在庫再計算時は
-- deleted_at IS NULL のレコードのみを対象とする。
-- ============================================================================

ALTER TABLE stock_incoming
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

ALTER TABLE stock_outgoing
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

ALTER TABLE stock_movement
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;
