# VÁY XINH - Cửa hàng thời trang

## Kiến trúc

```text
Vay Xinh/
├── frontend/               # React + Vite + Tailwind
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/
├── backend/                # Node.js + Express REST API
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── utils/
└── database/               # MySQL schema and seed data
```

## Yêu cầu

- Node.js 18 trở lên
- MySQL 8 trở lên
- VS Code

## Cài đặt

> `database/schema.sql` khởi tạo lại schema và có lệnh xóa bảng. Chỉ dùng cho database mới/trống; không import vào database hiện có. Để thêm catalog Váy Xinh mà giữ nguyên dữ liệu, dùng script bổ sung bên dưới.

```powershell
cd "C:\Vay Xinh\frontend"
npm install
cp .env.example .env
npm run dev
```

Mở terminal thứ hai:

```powershell
cd "C:\Vay Xinh\backend"
npm install
cp .env.example .env
npm run dev
```

Tạo cơ sở dữ liệu:

```powershell
mysql -u root -p < "C:\Vay Xinh\database\schema.sql"
```

Nếu đã có database và chỉ cần cập nhật bộ hình ảnh:

```powershell
mysql -u root -p ao_xinh < "C:\Vay Xinh\database\update-images.sql"
```

Thêm 18 sản phẩm đầu tiên từ [danh mục công khai của ICON Denim](https://icondenim.com/collections/tat-ca-san-pham) vào database hiện có:

```powershell
mysql -u root -p ao_xinh < "C:\Vay Xinh\database\import-icon-denim.sql"
```

Script này có thể chạy lặp lại và không xóa dữ liệu hiện có. Giá được lấy từ trang danh mục tại thời điểm nhập; hình ảnh Pexels, màu sắc, kích cỡ và tồn kho là dữ liệu mẫu, không phải ảnh hay thông tin kiểm kê của cửa hàng nguồn. Nội dung mô tả được viết lại ngắn gọn từ tên sản phẩm.

## Thêm catalog thời trang nữ và chatbot

Với database `ao_xinh` hiện có, chạy script bổ sung an toàn (không xóa/ghi đè sản phẩm hiện hữu):

```powershell
mysql -u root -p ao_xinh < "C:\Vay Xinh\database\seed-vay-xinh-products.sql"
```

Script thêm 30 mã `VX001`–`VX030`, gồm đúng 5 sản phẩm cho mỗi danh mục áo kiểu, váy đầm, quần nữ, áo khoác nữ, chân váy và áo thun nữ. Script bỏ qua SKU đã có; riêng `VX006`, `VX012` và `VX018` được chuyển danh mục nếu còn mang slug cũ từ phân bổ trước, đồng thời cập nhật ảnh chính và các màu mẫu tương ứng. Màu sắc, chất liệu, mô tả và tồn kho khởi tạo 8 cho mỗi màu/size là dữ liệu mẫu; cần đối soát với hàng thực tế trước khi mở bán. Ảnh nằm trong `frontend/public/images/products/`, đã tải về để triển khai ổn định; nguồn từng ảnh và giấy phép được ghi tại `frontend/public/images/products/credits.csv`. Ảnh stock minh họa đúng loại trang phục nhưng không thay thế ảnh xác thực SKU từ nhà cung cấp.

Để chuyển catalog hiện tại sang thời trang nữ và bé gái, đồng thời cập nhật tên, mô tả và ảnh sản phẩm sang phong cách thanh lịch tối giản, chạy:

```powershell
mysql -u root -p ao_xinh < "C:\Vay Xinh\database\refresh-korean-inspired-catalog.sql"
```

Script giữ nguyên giá, tồn kho, mã sản phẩm và đơn hàng; chuyển sản phẩm nam sang nữ hoặc bé gái, ẩn danh mục Nam/Trẻ em và dùng ảnh Pexels lưu cục bộ. Đây là catalog/ảnh minh họa độc lập theo cảm hứng phong cách, không sao chép ảnh hay nội dung sản phẩm của website tham khảo. Đối soát giá, chất liệu, size và tồn kho thực tế trước khi mở bán.

Chatbot có chế độ tư vấn cục bộ không cần khóa AI: tra cứu sản phẩm, giá, chất liệu, màu/size còn hàng, vận chuyển, thanh toán, đơn hàng và thông tin liên hệ từ website. Nếu muốn dùng câu trả lời tạo sinh tự nhiên hơn, có thể đặt khóa tùy chọn trong `backend/.env` (không đưa khóa vào frontend hoặc Git):

```env
OPENAI_API_KEY=your-server-side-key
OPENAI_MODEL=gpt-4o-mini
```

Khi có khóa, backend gửi thông tin catalog và chính sách cửa hàng cho nhà cung cấp AI; phản hồi chỉ được liên kết với mã sản phẩm đang có. Không cấu hình khóa vẫn dùng được chế độ tra cứu cục bộ.

## Cập nhật GitHub và triển khai Cloudflare

1. Kiểm tra thay đổi rồi commit/push từ thư mục gốc:

   ```powershell
   git status
   git add README.md backend database frontend
   git commit -m "Add women's catalog and AI stylist"
   git push origin main
   ```

2. Tạo/cập nhật Cloudflare Pages project kết nối repository: **Root directory** `frontend`, build command `npm run build`, output directory `dist`. Đặt biến Pages `VITE_API_URL` thành URL công khai của API, ví dụ `https://api.tenmien.vn/api`, rồi chạy redeploy.
3. Backend hiện là Express + MySQL (`mysql2`), không phải Pages Function. Triển khai backend Node.js trên dịch vụ hỗ trợ tiến trình Node và kết nối MySQL, hoặc chuyển backend sang Workers có Cloudflare Hyperdrive trước khi deploy Worker. Đặt `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `FRONTEND_URL`, `OPENAI_API_KEY` và `OPENAI_MODEL` trong secret/environment của dịch vụ backend; cho phép domain Pages trong `FRONTEND_URL`.
4. Chạy `database/seed-vay-xinh-products.sql` trên database hiện có qua SSH/console của nhà cung cấp hoặc MySQL client sau khi backup. Không chạy lại `schema.sql` trên database đang dùng.

## Import MySQL bằng XAMPP/phpMyAdmin

1. Mở XAMPP Control Panel và nhấn `Start` ở MySQL.
2. Mở `http://localhost/phpmyadmin`.
3. Chọn tab `Import`, chọn `database/schema.sql`, đặt charset `utf-8` và nhấn `Import`.
4. Kiểm tra database `ao_xinh` có các bảng `products`, `categories`, `product_images` và `product_variants`.
5. Database mặc định của XAMPP thường dùng `root` không mật khẩu. Giữ:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ao_xinh
```

Để thêm sản phẩm vào database đã có, chọn database `ao_xinh` trong phpMyAdmin rồi import `database/import-icon-denim.sql`.

Hoặc import bằng dòng lệnh:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" --default-character-set=utf8mb4 -u root -e "source C:/Vay Xinh/database/schema.sql"
```

## Khu vực quản trị

Đăng nhập bằng tài khoản có vai trò `ADMIN`, sau đó mở `http://localhost:5173/admin`. Dashboard và các API quản trị được bảo vệ ở backend. Bảng điều khiển gồm danh mục, sản phẩm, mã giảm giá, đơn hàng, khách hàng, tồn kho, phiếu nhập, Flash Sale, bảo hành/đổi trả, đánh giá, banner, bài viết, nhân viên, yêu cầu hỗ trợ và cài đặt cửa hàng.

Với database đã tồn tại, chạy migration bổ sung trước khi sử dụng:

```powershell
cd "C:\Vay Xinh\backend"
npm.cmd run migrate:admin
```

Tạo hoặc đặt lại tài khoản quản trị bằng biến môi trường (mật khẩu được băm trước khi lưu vào database, không ghi vào mã nguồn):

```powershell
$env:ADMIN_EMAIL = "your-admin@example.com"
$env:ADMIN_PASSWORD = "use-a-unique-password"
npm.cmd run create-admin
Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
```

Các thay đổi trong Cài đặt cửa hàng cập nhật thông tin liên hệ trên website; phí giao hàng và ngưỡng miễn phí được áp dụng cho đơn hàng mới.

Trong quản lý đơn hàng, trạng thái thanh toán có thể cập nhật riêng với trạng thái giao hàng. Tồn kho được trừ trong giao dịch đặt hàng thành công và hoàn lại khi hủy đơn; sản phẩm hết hàng hoặc còn tối đa 3 món được đánh dấu trên trang sản phẩm. Giỏ hàng kiểm tra lại tồn kho trước khi cho khách tiếp tục thanh toán; backend vẫn xác thực số lượng lần cuối khi tạo đơn.

Ảnh sản phẩm được chọn hoặc kéo-thả trong biểu mẫu thêm/chỉnh sửa, giới hạn JPG/PNG/WebP tối đa 5 MB và lưu tại `backend/uploads/products/`. Khi triển khai backend trên máy chủ, gắn persistent storage cho thư mục `backend/uploads/` để ảnh còn tồn tại sau khi redeploy.
