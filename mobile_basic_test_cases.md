# 📱 Mobile & Compatibility Basic Test Cases

This suite validates the core functionality, UI layout, and basic user interactions specifically for Mobile viewports and responsive scaling.

## 1. Ứng dụng tải đúng trên màn hình Mobile (Mobile Layout Initialization)
- **Mục tiêu:** Đảm bảo UI tổng thể không bị vỡ bố cục trên màn hình nhỏ.
- **Các bước:**
  1. Mở trình duyệt ở chế độ Responsive/Mobile (kích thước ~ 390x844 px).
  2. Truy cập ứng dụng và đăng nhập.
- **Kỳ vọng:** Sidebar bên trái biến mất, được thay thế hoàn toàn hoặc ẩn đúng cách. Không có thành phần nào trượt ra ngoài theo chiều ngang (tránh cuộn ngang toàn trang).

## 2. Hiển thị Menu Điều hướng (Mobile Navigation)
- **Mục tiêu:** Kiểm tra điều hướng trơn tru giữa Dashboard, SOPs, và Analytics.
- **Các bước:** Sử dụng menu mobile (hoặc thanh bar dưới cùng) để bấm qua lại các tab.
- **Kỳ vọng:** Màn hình chuyển mượt, UI tại các trang tương ứng hiển thị full màn hình trên điện thoại. Dấu hiệu Tab đang chọn (Active) hợp lý.

## 3. Cuộn ngang bảng Kanban (Horizontal Kanban Scrolling)
- **Mục tiêu:** Đảm bảo người dùng có thể xem tất cả các cột trên màn hẹp.
- **Các bước:** Quẹt (Swipe) ngang phần bảng Kanban để xem từ cột "Cần làm" đến "Đã xong".
- **Kỳ vọng:** Bảng cuộn ngang trơn tru (smooth scroll), các cột tách biệt. Header cột sticky hoặc cuộn cùng nội dung không bị lỗi render.

## 4. Tạo Task nhanh trên Mobile (Mobile Quick Add)
- **Mục tiêu:** Kiểm tra form tạo Task hoạt động trên di động.
- **Các bước:**
  1. Bấm nút nhập ngang hoặc (+) nếu có. 
  2. Bấm bàn phím ảo điện thoại lên, nhập "Task Mobile 1".
  3. Lưu.
- **Kỳ vọng:** Bàn phím ảo không che khuất ô input. Task được ghi nhận và nạp vào cột đầu tiên lập tức.

## 5. Mở chi tiết Task bằng Bottom Sheet (Task Mobile Sheet)
- **Mục tiêu:** Xác minh chức năng `isMobileSheetOpen` hoạt động như ý định sau update mã nguồn mới nhất.
- **Các bước:** Chạm (Tap) vào thẻ "Task Mobile 1" trên bảng Kanban.
- **Kỳ vọng:** Một khung Pop-up / Bottom Sheet trượt từ dưới lên chiếm khoảng 80% chiều cao màn hình. Tránh kiểu hiển thị Split-view nhồi nhét của Desktop trên Mobile. Màn nền mờ đen (backdrop).

## 6. Tính giờ bằng Bottom Sheet (Mobile Time Tracking)
- **Mục tiêu:** Kiểm tra nút bấm giờ (Timer) ở phía cố định trên màn hình điện thoại.
- **Các bước:**
  1. Trong Bottom Sheet, nhấn nút chạy giờ (có icon tam giác Start).
  2. Xem UI đồng hồ đổi hiển thị, chuyển màu/chữ.
- **Kỳ vọng:** Thời gian đếm tăng. Phần chứa đồng hồ bám trên cùng (sticky) của Bottom Sheet rõ ràng.

## 7. Xem và Hiển thị SOP trong Bottom Sheet (Mobile SOP View)
- **Mục tiêu:** Kiểm tra vùng kéo xem (scrollable area) của SOP cho task chi tiết.
- **Các bước:** Cùng trong Bottom Sheet đó, cuộn xem nội dung SOP hoặc hiển thị "Không có SOP".
- **Kỳ vọng:** Box thông báo "SOP không có" hoặc Nội dung thực tế hiển thị gọn gàng, tự xuống dòng (word-wrap).

## 8. Trải nghiệm thoát/Đóng sheet (Dismiss Bottom Sheet)
- **Mục tiêu:** Không bị kẹt trong màn hình Focus Mode trên mobile.
- **Các bước:** 
  1. Bấm ra ngoài khoảng trống rèm đen.
  2. Chờ timeout 300ms theo code.
- **Kỳ vọng:** Bottom sheet lướt tụt xuống, Timer nếu không chạy thì Hủy Focus (setActiveTask(null)). Layout trả lại bình thường.

## 9. Hiển thị Grid của SOP Library (SOP Mobile Grid)
- **Mục tiêu:** Tab tài liệu phản hồi thân thiện.
- **Các bước:** Chuyển qua trang Library (SOP).
- **Kỳ vọng:** Thay vì lưới 3 cột như desktop, các card SOP bung ra 1 cột tràn chiều rộng. Touch target vào các tag hoặc chữ đủ lớn.

## 10. Chọn Avatar Cập nhật Mới (Avatar Mobile Selection)
- **Mục tiêu:** Test code sử dụng ảnh `.png` thay `.webp` và UX hiển thị.
- **Các bước:** Mở Account modal/Settings => Bấm vào List avatar chọn cái mới.
- **Kỳ vọng:** Hình ảnh hiển thị chuẩn .png không bị vỡ. Bấm chọn cuộn linh hoạt với cử chỉ điện thoại. Lấy ngay update.
