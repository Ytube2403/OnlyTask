# 5 Test Case Phức Tạp (Complex / Edge Cases)

### Nhóm 6: Các luồng phức tạp (Complex Flows & Edge Cases)

**11. Bộ đếm thời gian khi đóng/mở lại trình duyệt (Time Tracking Persistence)**
*   **Mô tả:** Đảm bảo thời gian theo dõi không bị mất khi người dùng vô tình đóng tab hoặc hệ thống bị crash.
*   **Tiền điều kiện:** Người dùng đang đăng nhập, có 1 Task đang ở cột "In Progress".
*   **Các bước thực hiện:**
    1. Bấm nút "Start" để bắt đầu đếm giờ cho Task.
    2. Chờ 5 phút. Vẫn để đồng hồ chạy, tắt hoàn toàn tab trình duyệt (hoặc tắt ứng dụng).
    3. Mở lại trình duyệt, truy cập lại vào Dashboard.
*   **Kết quả mong đợi:** Đồng hồ đếm giờ của Task đó vẫn đang chạy tiếp nối dựa trên mốc thời gian bắt đầu lưu trên server (startTime), ứng dụng không bị reset thời gian về số 0.

**12. Xóa dữ liệu liên kết chéo (Orphaned Relations - SOPs & Tasks)**
*   **Mô tả:** Kiểm tra tính toàn vẹn dữ liệu khi một tài liệu SOP bị xóa nhưng vẫn đang được gắn vào nhiều Task.
*   **Tiền điều kiện:** Tạo 1 tài liệu "SOP_A". Tạo "Task_1" và "Task_2" đều gắn link tới "SOP_A".
*   **Các bước thực hiện:**
    1. Vào thư viện SOPs, xóa vĩnh viễn "SOP_A".
    2. Quay lại Dashboard, mở chi tiết "Task_1" và "Task_2".
*   **Kết quả mong đợi:** 
    - Ứng dụng không bị crash.
    - Thẻ SOP liên kết trong các Task tự động bị loại bỏ hoặc hiển thị nhãn "[Tài liệu đã bị xóa]" mà không phá vỡ UI. Các thao tác khác trên Task này vẫn diễn ra bình thường.

**13. Xử lý gián đoạn mạng ở luồng nhiều bước (Offline handling in Multi-step Review)**
*   **Mô tả:** Thử nghiệm việc rớt mạng đúng vào khoảnh khắc quan trọng nhất: khi hoàn thành Task và viết Review.
*   **Tiền điều kiện:** Người dùng đang làm việc ở bảng Kanban.
*   **Các bước thực hiện:**
    1. Kéo một Task từ "In Progress" thả sang "Done". Modal "Chấm điểm & Review" hiện lên.
    2. *Tắt kết nối Wifi/Internet của máy* (Giả lập mất mạng đột ngột).
    3. Nhập điểm và ghi chú review, sau đó bấm nút "Lưu / Hoàn tất".
*   **Kết quả mong đợi:**
    - Hệ thống bắt được ngoại lệ (Exception), không bị treo.
    - Hiển thị thông báo mất mạng.
    - Form Review **không bị đóng lại**, dữ liệu người dùng vừa gõ không bị mất để họ có thể bấm lưu lại khi có mạng. Task trên UI tạm thời chưa được đẩy hẳn sang cột "Done" trên server data.

**14. Hết hạn phiên đăng nhập trong lúc nhập liệu (Session Expiry during Data Entry)**
*   **Mô tả:** Hạn chế việc người dùng mất cả trang mô tả công việc dài do token (JWT) Supabase hết hạn.
*   **Tiền điều kiện:** Đang đăng nhập.
*   **Các bước thực hiện:**
    1. Bấm tạo mới 1 Task, mở form nhập liệu. Viết phần Description rất dài.
    2. Giữ nguyên màn hình đó trong vài tiếng (hoặc xóa thủ công token ở LocalStorage).
    3. Quay lại, bấm nút "Tạo Task" (Lưu dữ liệu).
*   **Kết quả mong đợi:** 
    - API trả về lỗi 401 Unauthorized, phần UI bắt lỗi báo "Phiên đăng nhập đã hết hạn...".
    - Data người dùng vừa điền ĐƯỢC GIỮ NGUYÊN hoặc được cache tạm thời, tránh bị mất văn bản dài.

**15. Thao tác đồng thời và Xung đột trạng thái (Concurrency / Race Condition)**
*   **Mô tả:** Kiểm tra hệ thống Drag & Drop (dnd-kit) khi trạng thái thay đổi đồng thời từ 2 luồng.
*   **Tiền điều kiện:** Mở ứng dụng trên 2 Tab trình duyệt (Tab A và Tab B) cùng chung một tài khoản.
*   **Các bước thực hiện:**
    1. Ở Tab A, để chuột chuẩn bị gắp "Task 1".
    2. Ở Tab B, xóa "Task 1" hoặc chuyển "Task 1" sang cột "Done".
    3. Chuyển ngay sang Tab A (lúc này chưa refresh nên vẫn thấy Task 1 ở cột cũ), thực hiện kéo thả "Task 1" sang cột "In Progress".
*   **Kết quả mong đợi:**
    - Optimistic UI của Tab A có thể ban đầu hiển thị Task 1 ở "In Progress".
    - Tuy nhiên, API gọi lên server sẽ trả về lỗi (do Task 1 không còn tồn tại hoặc đã thay đổi). Hệ thống sẽ **Rollback** UI của Tab A, tự động đồng bộ lại dữ liệu mới nhất mà không bị crash dnd-kit.
