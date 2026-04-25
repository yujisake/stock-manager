-- 管理番号（6桁）と容量カラムを追加
ALTER TABLE stock_items ADD COLUMN code TEXT UNIQUE;
ALTER TABLE stock_items ADD COLUMN volume TEXT;

-- テストデータに管理番号と容量を設定
UPDATE stock_items SET code = '100001', volume = '720ml'  WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE stock_items SET code = '100002', volume = '720ml'  WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE stock_items SET code = '100003', volume = '720ml'  WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE stock_items SET code = '100004', volume = '720ml'  WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE stock_items SET code = '100005', volume = '1800ml' WHERE id = '55555555-5555-5555-5555-555555555555';
