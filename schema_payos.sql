-- Thêm cột pending_order_code để lưu trữ mã thanh toán tạm thời
-- Khi Webhook từ PayOS báo về thành công, ta sẽ dựa vào mã này để tìm user và cấp Premium.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_order_code bigint;

-- Tạo index để truy vấn webhook cho nhanh
CREATE INDEX IF NOT EXISTS idx_profiles_pending_order_code ON public.profiles(pending_order_code);
