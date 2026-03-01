# 📱 Mobile & Compatibility Complex Test Cases

This suite focuses on edge cases, concurrent access across devices, responsive structural shifts, and touch-interaction edge cases.

## 1. Drag & Drop - Touch Interference (Xung đột cảm ứng Kéo thả)
- **Mục tiêu:** Đảm bảo thư viện DND hỗ trợ di động không giành lệnh của vuốt cuộn màn hình.
- **Các bước:** 
  1. Đặt ngón tay lên thẻ task và vuốt kéo ngang nhanh (Thao tác muốn cuộn Kanban sang phải).
  2. Đặt ngón tay lên thẻ, giữ yên > 250ms rôi mới vuốt màn hình.
- **Kỳ vọng:** 
  - (1) Cuộn mượt màn hình sang phương ngang.
  - (2) Kích hoạt nhấc thẻ lơ lửng, kéo bay thẻ qua cột khác an toàn, không mang theo cuộn màn hình.

## 2. Giao thoa Responsive tức thời (Resize Desktop to Mobile)
- **Mục tiêu:** Chắc chắn UI xử lý chuyển đổi state động thông minh.
- **Các bước:**
  1. Mở Cửa sổ ngang (Desktop), chọn 1 task để hiện Focus Split panel bên cạnh phải.
  2. Dùng chuột co hẹp cửa sổ trình duyệt xuống < 768px (MD breakpoint).
- **Kỳ vọng:** Split view bị giấu. Dựa theo điều kiện `isMobileSheetOpen` có thể chuyển dịch trạng thái hiện ra Mobile Overlay an toàn không làm crash component.

## 3. Khôi phục State bộ đếm tại Mobile Bottom Sheet qua LocalStorage
- **Mục tiêu:** Validation lại code Persist timer vừa fix nhưng ở workflow trên điện thoại.
- **Các bước:**
  1. Trên màn giả lập điện thoại, mở sheet -> nhấn Bấm giờ.
  2. Bấm reload (F5) tab trình duyệt mobile.
- **Kỳ vọng:** 
  Khi trang tải xong, do `useEffect`, biến `activeTask` có lưu local => kích mở tự động cờ sheet mobile lên => timer đếm tiếp tục tính từ mốc localStorage. Giao diện trực diện về trạng thái như chưa tắt.

## 4. Cuộn lồng nhau (Scroll Overlap Mitigation)
- **Mục tiêu:** Xử lý hiện tượng cuộn nội dung SOP bên trong sheet bị trình duyệt hiểu nhầm thành lệnh kéo sheet.
- **Các bước:**
  1. Mở xem 1 Task có chứa đoạn SOP cực kỳ dài, vượt tỷ lệ khung hình di động bên trong bottom sheet.
  2. Vuốt cuộn vùng xem SOP đó.
- **Kỳ vọng:** 
  Nội dung SOP đi chuyển lên xuống tự do, con trỏ sự kiện không bị rò rỉ ra backdrop gây tắt pop-up nhầm. Vùng `stopPropagation` cho click chạm hoạt động hiệu quả (chỉ tắt khi chạm đúng backdrop xám ngoài rìa). 

## 5. Đồng bộ trạng thái thiết bị chéo (Cross-device Data View Race)
- **Mục tiêu:** Đánh giá tính chịu tải và đồng bộ giữa 2 views PC vs Mobile song song.
- **Các bước:**
  1. Chế độ chia màn hình làm 2 acc (1 mobile view tab ẩn danh, 1 PC view).
  2. Tài khoản PC xoá 1 SOP, lúc này bên Mobile ấn mở task liên quan đang gắn SOP đó.
- **Kỳ vọng:** Code catch được fallbacks khi reference object ko tồn tại `linkedSop = null`, hiển thị giao diện báo *"Chưa gắn SOP / Open this task..."* như mới fix. Không throw React Exception Error đỏ trang do fetch undefined fields.
