CREATE DATABASE IF NOT EXISTS ao_xinh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ao_xinh;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS coupon_usages, order_items, payments, cart_items, product_images, product_variants,
  reviews, favorites, returns, support_requests, orders, carts, coupons, banners, addresses,
  products, categories, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('CUSTOMER','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  reset_token VARCHAR(255),
  reset_token_expires DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  province VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  ward VARCHAR(100) NOT NULL,
  detail_address VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  parent_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  description TEXT,
  material VARCHAR(150),
  base_price DECIMAL(12,2) NOT NULL,
  sale_price DECIMAL(12,2),
  is_new BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sold_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  color_name VARCHAR(60) NOT NULL,
  color_hex VARCHAR(7) DEFAULT '#000000',
  size ENUM('XS','S','M','L','XL','XXL') NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  UNIQUE(product_id, color_name, size),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  session_key VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  variant_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  UNIQUE(user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  discount_type ENUM('PERCENT','FIXED') NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL,
  min_order_value DECIMAL(12,2) DEFAULT 0,
  max_usage INT DEFAULT 100,
  used_count INT DEFAULT 0,
  start_at DATETIME,
  end_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NULL,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  province VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  ward VARCHAR(100) NOT NULL,
  address_detail VARCHAR(255) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  shipping_fee DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  coupon_code VARCHAR(40),
  payment_method ENUM('COD','VNPAY','MOMO') DEFAULT 'COD',
  status ENUM('CHO_XAC_NHAN','DA_XAC_NHAN','DANG_GIAO','DA_GIAO','DA_HUY') DEFAULT 'CHO_XAC_NHAN',
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  variant_id INT NULL,
  product_name VARCHAR(180) NOT NULL,
  color_name VARCHAR(60),
  size VARCHAR(10),
  unit_price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  provider ENUM('COD','VNPAY','MOMO') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('PENDING','SUCCESS','FAILED','REFUNDED') DEFAULT 'PENDING',
  transaction_ref VARCHAR(100),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE coupon_usages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT NOT NULL,
  user_id INT NULL,
  order_id INT NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  order_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, user_id, order_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  subtitle VARCHAR(255),
  image_url VARCHAR(500) NOT NULL,
  link_url VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('CHO_XU_LY','DA_DUYET','TU_CHOI') DEFAULT 'CHO_XU_LY',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE support_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(180),
  message TEXT NOT NULL,
  status ENUM('MO','DA_XU_LY') DEFAULT 'MO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  variant_id INT NOT NULL,
  quantity INT NOT NULL,
  supplier VARCHAR(150),
  notes TEXT,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE flash_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  discount_type ENUM('PERCENT','FIXED') NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  summary VARCHAR(500),
  content MEDIUMTEXT NOT NULL,
  cover_image VARCHAR(500),
  status ENUM('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE app_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO categories (name, slug) VALUES
('Nữ','nu'),('Nam','nam'),('Trẻ em','tre-em'),('Áo','ao'),('Quần','quan'),('Phụ kiện','phu-kien');

INSERT INTO users (full_name,email,phone,password_hash,role) VALUES
('Quản trị Áo Xinh','admin@aoxinh.vn','0900000001','$2a$12$FdwGms1ylxIjGYErvqUhf.nDGh3nJzBZUHQmdGLLzVpbizb7EZihW','ADMIN'),
('Khách hàng mẫu','khach@aoxinh.vn','0900000002','$2a$12$FdwGms1ylxIjGYErvqUhf.nDGh3nJzBZUHQmdGLLzVpbizb7EZihW','CUSTOMER');

INSERT INTO coupons (code,discount_type,discount_value,min_order_value,max_usage,start_at,end_at,is_active) VALUES
('AOXINH10','PERCENT',10,300000,1000,'2026-01-01 00:00:00','2027-12-31 23:59:59',TRUE),
('GIAM100K','FIXED',100000,1000000,500,'2026-01-01 00:00:00','2027-12-31 23:59:59',TRUE);

INSERT INTO banners (title,subtitle,image_url,link_url,sort_order,is_active) VALUES
('Bộ sưu tập mùa mới','Tinh tế mỗi ngày - nhẹ nhàng tự tin','https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg?auto=compress&cs=tinysrgb&w=1800&h=800&fit=crop','/products',1,TRUE),
('Phong cách thanh lịch','Diện đẹp từ công sở đến cuối tuần','https://images.pexels.com/photos/977908/pexels-photo-977908.jpeg?auto=compress&cs=tinysrgb&w=1800&h=800&fit=crop','/category/nu',2,TRUE),
('Ưu đãi cuối tuần','Giảm đến 30% cho thời trang Áo Xinh','https://images.pexels.com/photos/769122/pexels-photo-769122.jpeg?auto=compress&cs=tinysrgb&w=1800&h=800&fit=crop','/products?sale=true',3,TRUE);

INSERT INTO products (category_id,name,slug,code,description,material,base_price,sale_price,is_new,is_featured,sold_count) VALUES
(4,'Áo thun basic pastel','ao-thun-basic-pastel','AX001','Áo thun cotton mềm, form rộng thoải mái','100% cotton',249000,199000,TRUE,TRUE,320),
(4,'Áo sơ mi linen cổ Peter','ao-so-mi-linen-co-peter','AX002','Sơ mi linen nhẹ, tạo điểm nhấn cổ nổi bật','Linen pha cotton',459000,NULL,TRUE,TRUE,210),
(4,'Áo croptop tay bồng','ao-croptop-tay-bong','AX003','Croptop nữ tính với tay bồng nhẹ','Vải dệt mềm',299000,249000,TRUE,TRUE,188),
(4,'Áo polo nam cổ viền','ao-polo-nam-co-vien','AX004','Polo nam thoáng mát, form đứng','Cotton pique',359000,299000,TRUE,TRUE,276),
(4,'Áo khoác denim trẻ em','ao-khoac-denim-tre-em','AX005','Áo khoác denim bền đẹp cho bé','Denim cotton',529000,NULL,TRUE,FALSE,95),
(4,'Áo gile len cổ V','ao-gile-len-co-v','AX006','Gile len dễ phối layer mùa lạnh','Len acrylic',399000,349000,FALSE,TRUE,175),
(4,'Áo kiểu voan tay lửng','ao-kieu-voan-tay-lung','AX007','Áo kiểu nhẹ nhàng, dành cho sự kiện','Voan cao cấp',489000,NULL,TRUE,FALSE,132),
(4,'Áo thun nam in minimal','ao-thun-nam-in-minimal','AX008','Thun nam họa tiết tối giản','Cotton compact',279000,229000,FALSE,TRUE,245),
(4,'Áo cardigan kẻ trẻ em','ao-cardigan-ke-tre-em','AX009','Cardigan kẻ dễ thương, giữ ấm nhẹ','Len cotton',429000,379000,TRUE,FALSE,88),
(4,'Áo sát nách mùa hè','ao-sat-nach-mua-he','AX010','Áo sát nách thoáng mát, năng động','Cotton modal',229000,NULL,TRUE,FALSE,151),
(5,'Quần jean ống suông','quan-jean-ong-suong','AX011','Jean ống suông che khuyết điểm','Denim 12oz',599000,499000,TRUE,TRUE,304),
(5,'Quần short kaki nam','quan-short-kaki-nam','AX012','Short kaki trẻ trung, nhiều túi','Kaki cotton',329000,279000,FALSE,TRUE,221),
(5,'Quần suông cạp cao','quan-suong-cap-cao','AX013','Quần suông thanh lịch, cạp ôm','Vải tuyết mưa',459000,NULL,TRUE,TRUE,198),
(5,'Quần kaki ống đứng','quan-kaki-ong-dung','AX014','Quần kaki dễ mặc, dễ phối','Cotton elastane',419000,359000,FALSE,TRUE,160),
(5,'Quần short bé trai','quan-short-be-trai','AX015','Short bé trai co giãn nhẹ','Cotton twill',249000,199000,TRUE,FALSE,120),
(5,'Quần jogger nữ','quan-jogger-nu','AX016','Jogger năng động, 3 màu basic','Cotton French terry',379000,329000,TRUE,TRUE,267),
(5,'Quần ống loe công sở','quan-ong-loe-cong-so','AX017','Quần ống loe thiết kế thanh lịch','Tây cao cấp',549000,NULL,FALSE,TRUE,142),
(5,'Quần jean bé gái','quan-jean-be-gai','AX018','Jean bé gái co giãn nhẹ','Denim cotton',399000,349000,TRUE,FALSE,78),
(5,'Quần lửng linen','quan-lung-linen','AX019','Linen mát, form rộng','Linen pha',449000,399000,FALSE,FALSE,108),
(5,'Quần ống rộng kaki','quan-ong-rong-kaki','AX020','Quần ống rộng thời trang','Kaki suông',469000,NULL,TRUE,TRUE,183),
(1,'Váy midi hoa nhí','vay-midi-hoa-nhi','AX021','Váy midi hoa nhí đi chơi cuối tuần','Voan lụa',549000,449000,TRUE,TRUE,289),
(1,'Đầm suông tay phồng','dam-suong-tay-phong','AX022','Đầm suông nữ tính, nhẹ nhàng','Cotton linen',699000,NULL,TRUE,TRUE,174),
(1,'Chân váy xếp ly','chan-vay-xep-ly','AX023','Chân váy xếp ly dài qua gối','Vải tuyết mưa',419000,369000,FALSE,TRUE,205),
(2,'Áo khoác bomber nam','ao-khoac-bomber-nam','AX024','Bomber unisex chống gió nhẹ','Polyester',649000,549000,TRUE,TRUE,240),
(2,'Áo vest slimfit','ao-vest-slimfit','AX025','Vest slimfit cho công sở và dự tiệc','Tay wool blend',1299000,NULL,TRUE,TRUE,62),
(2,'Áo len cổ tròn nam','ao-len-co-tron-nam','AX026','Len cổ tròn mềm, giữ ấm','Cotton len',499000,449000,FALSE,TRUE,133),
(3,'Set váy bé gái hoa','set-vay-be-gai-hoa','AX027','Set váy hai chi tiết cho bé','Cotton',459000,399000,TRUE,TRUE,96),
(3,'Set đồ bé trai năng động','set-do-be-trai-nang-dong','AX028','Set áo quần cotton thoáng khí','Cotton',429000,379000,TRUE,TRUE,105),
(6,'Khăn choàng cổ','khan-choang-co','AX029','Khăn choàng họa tiết nhẹ','Len acrylic',199000,149000,FALSE,TRUE,224),
(6,'Túi tote canvas','tui-tote-canvas','AX030','Tote canvas rộng rãi, dễ phối','Canvas',289000,239000,TRUE,TRUE,316);

INSERT INTO products (category_id,name,slug,code,description,material,base_price,sale_price,is_new,is_featured,sold_count) VALUES
(1,'Áo blouse cổ tròn','ao-blouse-co-tron','AX031','Áo blouse nữ kiểu cổ tròn thanh lịch','Voan cotton',389000,349000,TRUE,TRUE,118),
(1,'Váy two-piece pastel','vay-two-piece-pastel','AX032','Váy hai lớp màu pastel nữ tính','Cotton linen',649000,579000,TRUE,TRUE,106),
(2,'Áo sơ mi Oxford nam','ao-so-mi-oxford-nam','AX033','Sơ mi Oxford nam form regular','Cotton Oxford',459000,399000,TRUE,TRUE,142),
(2,'Quần chinos slim nam','quan-chinos-slim-nam','AX034','Quần chinos nam co giãn nhẹ','Cotton elastane',499000,449000,TRUE,TRUE,151),
(3,'Áo thun polo bé gái','ao-thun-polo-be-gai','AX035','Polo bé gái cotton mềm','Cotton organic',279000,249000,TRUE,TRUE,86),
(3,'Set short áo bé trai','set-short-ao-be-trai','AX036','Set áo short bé trai thoáng mát','Cotton thoáng khí',399000,349000,TRUE,TRUE,92);

UPDATE products SET category_id=1 WHERE code IN ('AX001','AX002','AX003','AX006','AX007','AX010','AX011','AX013','AX016','AX021','AX022','AX023','AX031','AX032');
UPDATE products SET category_id=2 WHERE code IN ('AX004','AX008','AX012','AX014','AX017','AX020','AX024','AX025','AX026','AX030','AX033','AX034');
UPDATE products SET category_id=3 WHERE code IN ('AX005','AX009','AX015','AX018','AX019','AX027','AX028','AX029','AX035','AX036');

CREATE TEMPORARY TABLE image_sources (
  position_no TINYINT PRIMARY KEY,
  photo_id VARCHAR(20) NOT NULL
);

INSERT INTO image_sources(position_no,photo_id) VALUES
(1,'994523'),(2,'1689731'),(3,'977908'),(4,'769122'),(5,'1468379'),
(6,'1755428'),(7,'1036622'),(8,'1040945'),(9,'1536619'),(10,'1043474'),
(11,'985635'),(12,'1181686'),(13,'1183266'),(14,'3755706'),(15,'5325880'),
(16,'7679720'),(17,'5709665'),(18,'6311387'),(19,'6311392'),(20,'6311572'),
(21,'769138'),(22,'4066297'),(23,'8532616'),(24,'7203787'),(25,'7679650'),
(26,'6626903'),(27,'6764019'),(28,'8454345'),(29,'1021145'),(30,'206064'),(31,'1126993'),(32,'1884581'),(33,'298863'),(34,'1381556'),(35,'9558606'),(36,'8553917');

INSERT INTO product_images(product_id,image_url,sort_order,is_primary)
SELECT p.id,
       CONCAT('https://images.pexels.com/photos/',s.photo_id,'/pexels-photo-',s.photo_id,'.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'),
       1, TRUE
FROM products p JOIN image_sources s ON s.position_no=p.id;

INSERT INTO product_images(product_id,image_url,sort_order,is_primary)
SELECT p.id,
       CONCAT('https://images.pexels.com/photos/',s.photo_id,'/pexels-photo-',s.photo_id,'.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'),
       2, FALSE
FROM products p JOIN image_sources s ON s.position_no=MOD(p.id,30)+1;

INSERT INTO product_images(product_id,image_url,sort_order,is_primary)
SELECT p.id,
       CONCAT('https://images.pexels.com/photos/',s.photo_id,'/pexels-photo-',s.photo_id,'.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'),
       3, FALSE
FROM products p JOIN image_sources s ON s.position_no=MOD(p.id+9,30)+1;

DROP TEMPORARY TABLE image_sources;

INSERT INTO product_variants (product_id,color_name,color_hex,size,stock)
SELECT p.id, c.color_name, c.color_hex, s.size,
       CASE WHEN MOD(p.id + s.n + c.n, 7) = 0 THEN 0 ELSE 8 + MOD(p.id * 3 + s.n, 20) END
FROM products p
JOIN (SELECT 'Hồng' color_name,'#f6a8bd' color_hex,1 n UNION ALL SELECT 'Đen','#171717',2 UNION ALL SELECT 'Trắng','#ffffff',3) c
JOIN (SELECT 'XS' size,1 n UNION ALL SELECT 'S',2 UNION ALL SELECT 'M',3 UNION ALL SELECT 'L',4 UNION ALL SELECT 'XL',5 UNION ALL SELECT 'XXL',6) s;
