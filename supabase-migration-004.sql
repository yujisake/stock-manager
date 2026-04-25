-- ============================================================================
-- migration-004: 在庫管理をログ（台帳）方式に再設計
-- ============================================================================
-- 在庫の変動はすべて stock_incoming / stock_outgoing / stock_movement
-- の3テーブルに記録し、stock_inventory は現在値キャッシュとして再計算で更新する。
-- ============================================================================

-- 既存データをリセット（stock_items は維持）
TRUNCATE stock_inventory RESTART IDENTITY CASCADE;
TRUNCATE stock_history RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------------------
-- 入庫ログ
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_incoming (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  operator_name TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 出荷ログ
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_outgoing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shipment_type TEXT NOT NULL CHECK (shipment_type IN (
    'normal','reserve_shop','reserve_online','reserve_domestic','reserve_export','defective_ok','reserve_damaged'
  )),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  operator_name TEXT,
  destination TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 移動ログ（差分）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  field TEXT NOT NULL CHECK (field IN (
    'reserve_shop','reserve_online','reserve_domestic','reserve_export',
    'defective_ok','reserve_damaged','defective_ng'
  )),
  delta INTEGER NOT NULL,
  operator_name TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- インデックス
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_stock_incoming_item_id ON stock_incoming(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_outgoing_item_id ON stock_outgoing(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movement_item_id ON stock_movement(item_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE stock_incoming ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_outgoing ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_incoming_all" ON stock_incoming;
DROP POLICY IF EXISTS "stock_outgoing_all" ON stock_outgoing;
DROP POLICY IF EXISTS "stock_movement_all" ON stock_movement;

CREATE POLICY "stock_incoming_all" ON stock_incoming FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "stock_outgoing_all" ON stock_outgoing FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "stock_movement_all" ON stock_movement FOR ALL USING (true) WITH CHECK (true);
