# Hướng Dẫn Cài Đặt VaultCloud Extension (Tiếng Việt)

## Cài Đặt Nhanh

### Bước 1: Tải OpenPGP.js

1. Mở trình duyệt và truy cập: https://unpkg.com/openpgp@5.11.0/dist/openpgp.min.js
2. Nhấn `Ctrl+S` để lưu file
3. Đặt tên file: `openpgp.min.js`
4. Lưu vào thư mục: `extension/chrome/`
5. Đường dẫn đầy đủ: `F:\Git\VaultCloud\extension\chrome\openpgp.min.js`

### Bước 2: Tạo Icons (Tùy chọn)

**Cách 1: Chuyển đổi từ SVG**
- Mở file: `extension/chrome/icons/icon.svg`
- Truy cập: https://svgtopng.com/
- Tải lên file SVG
- Chọn kích thước: 128x128, 48x48, 16x16
- Tải về và đặt tên: `icon128.png`, `icon48.png`, `icon16.png`
- Lưu vào: `extension/chrome/icons/`

**Cách 2: Bỏ qua (Dùng tạm)**
- Extension vẫn hoạt động bình thường không có icons
- Có thể tạo icons sau

### Bước 3: Cài Extension Vào Chrome

1. Mở Chrome
2. Gõ vào thanh địa chỉ: `chrome://extensions/`
3. Bật "Chế độ nhà phát triển" (Developer mode) ở góc phải trên
4. Nhấn "Tải tiện ích đã giải nén" (Load unpacked)
5. Chọn thư mục: `F:\Git\VaultCloud\extension\chrome`
6. Nhấn "Chọn thư mục"

### Bước 4: Cấu Hình Extension

1. Nhấn vào biểu tượng VaultCloud trên thanh công cụ
2. Nhập URL backend của bạn:
   - **Máy local**: `http://localhost:8787`
   - **Production**: `https://vaultcloud-cua-ban.workers.dev`
3. Nhấn "Save Configuration"
4. Đăng nhập bằng email và mật khẩu

## Sử Dụng

### Tự Động Điền Mật Khẩu

1. Vào một trang web có form đăng nhập
2. Nhấn vào biểu tượng 🔑 bên cạnh ô mật khẩu
3. Chọn tài khoản muốn dùng
4. Form sẽ được điền tự động

### Lưu Mật Khẩu Mới

1. Điền form đăng nhập trên bất kỳ trang web nào
2. Nhấn nút "Đăng nhập" hoặc "Submit"
3. Sau khi đăng nhập thành công, một banner sẽ xuất hiện góc trên bên phải
4. Kiểm tra thông tin username và website
5. (Tùy chọn) Thêm tiêu đề cho mục lưu trữ
6. Nhấn "Save Password"

### Xem Mật Khẩu Đã Lưu

1. Nhấn biểu tượng extension
2. Xem danh sách mật khẩu cho website hiện tại
3. Nhấn vào mục nào đó để copy mật khẩu
4. Nhấn "Open Full Vault" để mở giao diện đầy đủ

## Tính Năng Bảo Mật

### Mã Hóa PGP

Nếu tài khoản của bạn đã bật PGP:

- ✅ **Lưu mật khẩu mới**: Tự động mã hóa bằng public key
- ✅ **Xem mật khẩu**: Cần mở Full Vault để giải mã
- ℹ️ **Lý do**: Private key và passphrase chỉ có trong ứng dụng chính (bảo mật hơn)

### Đăng Nhập Không Mật Khẩu (FIDO2)

Nếu bạn đã đăng ký security key:

1. Nhấn biểu tượng extension
2. Chuyển sang tab "Security Key"
3. Nhập email
4. Nhấn "Use Security Key"
5. Làm theo hướng dẫn của trình duyệt (chạm security key, quét vân tay, v.v.)

## Xử Lý Lỗi

### Không tìm thấy file manifest
- Đảm bảo chọn đúng thư mục `extension/chrome`
- Kiểm tra file `manifest.json` có tồn tại

### Lỗi "openpgp is not defined"
- Tải file `openpgp.min.js` theo Bước 1
- Đảm bảo đặt đúng vị trí: `extension/chrome/openpgp.min.js`

### Không kết nối được backend
- Kiểm tra URL backend đã đúng chưa
- Đảm bảo backend đang chạy
- Với local: Chạy `npm run dev` ở thư mục gốc project
- Mở Console để xem chi tiết lỗi (F12)

### Auto-fill không hoạt động
- Đảm bảo đã đăng nhập vào extension
- Kiểm tra URL website có khớp với mật khẩu đã lưu
- Một số trang web dùng form đặc biệt có thể không nhận diện được

### Banner lưu mật khẩu không hiện
- Phải đăng nhập extension trước
- Form phải được submit thành công
- Banner xuất hiện sau 1 giây kể từ khi submit
- Chỉ một banner xuất hiện tại một thời điểm

## Danh Sách File Cần Thiết

```
extension/chrome/
├── ✅ manifest.json          (đã có)
├── ✅ background.js          (đã có)
├── ✅ content.js             (đã có)
├── ✅ popup.html             (đã có)
├── ✅ popup.js               (đã có)
├── ⬜ openpgp.min.js         (cần tải về - BẮT BUỘC)
└── icons/
    ├── ⬜ icon16.png         (tùy chọn)
    ├── ⬜ icon48.png         (tùy chọn)
    └── ⬜ icon128.png        (tùy chọn)
```

## Link Hữu Ích

- **Tải OpenPGP.js**: https://unpkg.com/openpgp@5.11.0/dist/openpgp.min.js
- **Chuyển SVG sang PNG**: https://svgtopng.com/
- **Trang Extensions**: chrome://extensions/

## Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra lại các bước trên
2. Xem file `README.md` trong thư mục extension
3. Mở issue trên GitHub
