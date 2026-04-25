-- =============================================
-- 在庫管理システム（stock-manager）テーブル定義
-- 既存のSupabaseプロジェクト内に作成
-- テーブル名は stock_ プレフィックスで分離
-- =============================================

-- 1. お酒アイテムマスタ
CREATE TABLE stock_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                    -- アイテム名（例：土田 生もと仕込み）
  storage_location TEXT,                 -- 保管場所
  description TEXT,                      -- 備考
  is_active BOOLEAN DEFAULT true,        -- 有効フラグ
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 在庫データ（1アイテムにつき1レコード）
CREATE TABLE stock_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  total INTEGER NOT NULL DEFAULT 0,           -- 総在庫
  reserve_shop INTEGER NOT NULL DEFAULT 0,    -- 売店 取置
  reserve_online INTEGER NOT NULL DEFAULT 0,  -- 通販 取置
  reserve_domestic INTEGER NOT NULL DEFAULT 0,-- 国内 取置
  reserve_export INTEGER NOT NULL DEFAULT 0,  -- 海外 取置
  defective INTEGER NOT NULL DEFAULT 0,       -- 不良品
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_id)
);

-- 3. 変更履歴
CREATE TABLE stock_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  changed_field TEXT NOT NULL,           -- 変更した項目（total, reserve_shop, etc.）
  old_value INTEGER,                     -- 変更前の値
  new_value INTEGER,                     -- 変更後の値
  operator_name TEXT,                    -- 操作者名
  destination TEXT,                      -- 出荷先（出荷時のみ記入）
  note TEXT,                             -- メモ
  created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_stock_history_item_id ON stock_history(item_id);
CREATE INDEX idx_stock_history_created_at ON stock_history(created_at DESC);

-- RLS（Row Level Security）は無効のまま（認証なしでアクセス可能にする）
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- 全員がアクセス可能なポリシー
CREATE POLICY "stock_items_all" ON stock_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "stock_inventory_all" ON stock_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "stock_history_all" ON stock_history FOR ALL USING (true) WITH CHECK (true);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_stock_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW EXECUTE FUNCTION update_stock_updated_at();

CREATE TRIGGER stock_inventory_updated_at
  BEFORE UPDATE ON stock_inventory
  FOR EACH ROW EXECUTE FUNCTION update_stock_updated_at();
