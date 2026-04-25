-- ============================================================================
-- migration-006: 出荷種別に確保枠3種を追加
-- ============================================================================
-- 既存の取置出荷（reserve_shop 等）と同じパターンで、
-- 確保枠（reserve_frame_shop / reserve_frame_online / reserve_frame_liquor）
-- からの出荷を許可する。
--
-- 既存の CHECK 制約を一旦 DROP し、新3種を含めて再作成する。
-- ============================================================================

ALTER TABLE stock_outgoing DROP CONSTRAINT IF EXISTS stock_outgoing_shipment_type_check;

ALTER TABLE stock_outgoing ADD CONSTRAINT stock_outgoing_shipment_type_check
  CHECK (shipment_type IN (
    'normal',
    'reserve_shop',
    'reserve_online',
    'reserve_domestic',
    'reserve_export',
    'defective_ok',
    'reserve_damaged',
    'reserve_frame_shop',
    'reserve_frame_online',
    'reserve_frame_liquor'
  ));
