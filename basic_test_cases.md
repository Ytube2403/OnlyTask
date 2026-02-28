# 10 Test Case Cơ Bản (Basic Test Cases)

### Nhóm 1: Quản lý vòng đời của Task (CRUD)

**1. Tạo mới một Task (Create Task)**
*   **Tiền điều kiện:** Đã đăng nhập vào ứng dụng và đang ở không gian làm việc chính (Main Workspace).
*   **Các bước thực hiện:** 
    1. Nhấn nút "Tạo Task mới" (hoặc Quick Add).
    2. Nhập tiêu đề ("Làm báo cáo"), chọn ngày hết hạn, và gắn tag `#Công_việc`.
    3. Nhấn "Lưu / Tạo".
*   **Kết quả mong đợi:** Task mới xuất hiện trên bảng (thường ở cột "To Do" hoặc "Inbox"), chứa đầy đủ thông tin vừa nhập. Dữ liệu được lưu chính xác vào Supabase.

**2. Sửa thông tin Task (Edit Task)**
*   **Tiền điều kiện:** Có ít nhất 1 Task đang tồn tại trên bảng.
*   **Các bước thực hiện:**
    1. Click vào Task để mở modal chi tiết.
    2. Thay đổi tiêu đề, cập nhật phần mô tả (Description) hoặc thay đổi ước tính thời gian (Est. Time).
    3. Nhấn "Cập nhật / Lưu".
*   **Kết quả mong đợi:** Các thay đổi mới được hiển thị ngay lập tức trên UI và được cập nhật thành công lên Database.

**3. Xóa Task (Delete Task)**
*   **Tiền điều kiện:** Có ít nhất 1 Task đang tồn tại.
*   **Các bước thực hiện:**
    1. Mở modal chi tiết của Task hoặc nhấn icon thùng rác trên thẻ Task.
    2. Xác nhận xóa trên popup cảnh báo.
*   **Kết quả mong đợi:** Task biến mất khỏi giao diện không gian làm việc và bản ghi tương ứng trong database bị xóa.

### Nhóm 2: Tương tác & Trạng thái làm việc (Kanban / Flow)

**4. Kéo thả Task giữa các cột (Drag & Drop Kanban)**
*   **Tiền điều kiện:** Màn hình đang ở chế độ xem Kanban. Có 1 Task ở cột "To-do".
*   **Các bước thực hiện:**
    1. Click giữ thẻ Task ở cột "To-do".
    2. Kéo và thả sang cột "In Progress".
*   **Kết quả mong đợi:** Thẻ Task nằm in tại cột "In Progress". Thuộc tính `status` hoặc `column_id` của Task được cập nhật ngầm trên server thành công.

**5. Luồng hoàn thành Task & Quy trình Review (Task Completion & Review)**
*   **Tiền điều kiện:** Task đang ở trạng thái xử lý ("In progress").
*   **Các bước thực hiện:** 
    1. Chuyển/Kéo Task sang cột "Done" (hoặc click checkbox "Hoàn thành").
    2. Form "Review / Chấm điểm" (Chấm điểm 1-10 và Ghi chú phản tỉnh) hiện lên.
    3. Nhập điểm 8/10 và ghi chú "Cần làm nhanh hơn", sau đó Lưu.
*   **Kết quả mong đợi:** Task được đánh dấu là Done. Điểm số và ghi chú được lưu vào Database (`score`, `review_note`). Task hiển thị nhãn/icon chứng tỏ đã được hoàn thành.

### Nhóm 3: Tính năng mở rộng (SOPs & Tracking)

**6. Gắn Hướng dẫn/SOP vào Task**
*   **Tiền điều kiện:** Hệ thống đã có sẵn 1 SOP tên "Quy trình thiết kế".
*   **Các bước thực hiện:**
    1. Mở chi tiết 1 Task đang có.
    2. Tại mục "Linked SOPs", tìm kiếm từ khóa "Quy trình", chọn SOP hiển thị ra.
    3. Lưu lại Task.
*   **Kết quả mong đợi:** SOP được liên kết thành công. Người dùng click vào Task có thể xem trực tiếp hoặc bấm mở nhanh SOP đó ra để đọc khi làm việc.

**7. Tính năng bộ đếm thời gian (Time Tracking)**
*   **Tiền điều kiện:** Đang trong chi tiết Task hoặc thẻ Task có hỗ trợ nút tính giờ.
*   **Các bước thực hiện:**
    1. Nhấn nút "Start" (Play) trên 1 Task.
    2. Chờ 1 phút rồi nhấn "Stop".
*   **Kết quả mong đợi:** Hệ thống ghi nhận chính xác thời gian đã trôi qua.

### Nhóm 4: Bảo mật & Phân quyền (Security)

**8. Tính riêng tư dữ liệu theo người dùng (Data Isolation / RLS)**
*   **Tiền điều kiện:** Có 2 tài khoản: User A và User B. User A có 5 Tasks riêng.
*   **Các bước thực hiện:**
    1. Đăng xuất khỏi User A, đăng nhập bằng User B.
    2. Truy cập vào Dashboard.
*   **Kết quả mong đợi:** User B nhìn thấy bảng điều khiển trống (hoặc chỉ thấy các Task của riêng User B). User B tuyệt đối không được nhìn thấy 5 Tasks của User A.

**9. Hết hạn phiên đăng nhập (Session Expiry / Unauthorized Access)**
*   **Tiền điều kiện:** Đang đăng nhập bình thường.
*   **Các bước thực hiện:**
    1. Xóa toàn bộ Cookie/Local Storage của trang trên trình duyệt (giả lập việc mất JWT token), sau đó tải lại trang `/dashboard`.
*   **Kết quả mong đợi:** Ứng dụng lập tức chặn quyền truy cập và điều hướng người dùng quay lại màn hình Login.

### Nhóm 5: Giao diện / Trải nghiệm (UI/UX)

**10. Kiểm thử trạng thái trống và Báo lỗi (Empty States & Error Handling)**
*   **Tiền điều kiện:** Tài khoản mới tạo, chưa có bất kỳ Task nào. Ngắt ngầm kết nối mạng.
*   **Các bước thực hiện:**
    1. Vào Dashboard -> hiển thị màn hình Empty State.
    2. Nhấn "Tạo Task mới" -> Nhập tên -> Lưu (trong lúc đang mất mạng).
*   **Kết quả mong đợi:** Giao diện khi trống nhìn thân thiện. App thông báo lỗi kết nối mạng thay vì crash.
