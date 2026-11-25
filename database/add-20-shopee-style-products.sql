USE ao_xinh;

START TRANSACTION;

INSERT INTO categories (name, slug, parent_id, is_active)
SELECT seed.name, seed.slug, nu.id, TRUE
FROM categories nu
JOIN (
  SELECT 'Áo kiểu' name, 'ao-kieu' slug
  UNION ALL SELECT 'Váy đầm', 'vay-dam'
  UNION ALL SELECT 'Quần nữ', 'quan-nu'
  UNION ALL SELECT 'Áo khoác nữ', 'ao-khoac-nu'
  UNION ALL SELECT 'Chân váy', 'chan-vay'
  UNION ALL SELECT 'Áo thun nữ', 'ao-thun-nu'
) seed
WHERE nu.slug = 'nu'
  AND NOT EXISTS (SELECT 1 FROM categories existing WHERE existing.slug = seed.slug);

INSERT INTO categories (name, slug, parent_id, is_active)
SELECT 'Bé gái', 'be-gai', nu.id, TRUE
FROM categories nu
WHERE nu.slug = 'nu'
  AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'be-gai');

INSERT INTO products (
  category_id, name, slug, code, description, material,
  base_price, sale_price, is_new, is_featured, sold_count
)
SELECT category.id, seed.name, seed.slug, seed.code, seed.description, seed.material,
       seed.price, seed.sale_price, TRUE, TRUE, seed.sold_count
FROM (
  SELECT 'ao-kieu' category_slug, 'Áo sơ mi nữ cổ bèo' name, 'ao-so-mi-nu-co-beo-shp001' slug, 'SHP001' code, 'Áo sơ mi cổ bèo thanh lịch, form vừa, phù hợp đi làm hoặc dạo phố.' description, 'Cotton pha' material, 329000 price, 279000 sale_price, 86 sold_count
  UNION ALL SELECT 'ao-kieu','Áo kiểu ren tay bồng','ao-kieu-ren-tay-bong-shp002','SHP002','Áo kiểu ren tay bồng, thiết kế nữ tính và dễ phối đồ.','Ren polyester',389000,349000,72
  UNION ALL SELECT 'ao-kieu','Áo peplum nữ tối giản','ao-peplum-nu-toi-gian-shp003','SHP003','Áo peplum nhẹ nhàng, nhấn eo và phù hợp phối quần tây.','Cotton rayon',359000,299000,64
  UNION ALL SELECT 'vay-dam','Đầm hoa nhí dáng dài','dam-hoa-nhi-dang-dai-shp004','SHP004','Đầm hoa nhí dáng dài, chất vải rũ nhẹ và thoáng mát.','Voan mềm',559000,499000,118
  UNION ALL SELECT 'vay-dam','Đầm suông cổ vuông','dam-suong-co-vuong-shp005','SHP005','Đầm suông cổ vuông tối giản, dễ mặc và phù hợp nhiều dịp.','Polyester pha',469000,399000,95
  UNION ALL SELECT 'quan-nu','Quần jean ống suông nữ','quan-jean-ong-suong-nu-shp006','SHP006','Quần jean ống suông, cạp cao và form ôm vừa phần eo.','Denim cotton',499000,429000,132
  UNION ALL SELECT 'quan-nu','Quần short kaki nữ','quan-short-kaki-nu-shp007','SHP007','Quần short kaki form gọn, có túi và khóa tiện dụng.','Kaki cotton',329000,289000,78
  UNION ALL SELECT 'ao-khoac-nu','Áo khoác kaki nữ','ao-khoac-kaki-nu-shp008','SHP008','Áo khoác kaki cổ đức, thiết kế năng động cho thời tiết mát.','Kaki cotton',629000,549000,69
  UNION ALL SELECT 'chan-vay','Chân váy jean dáng chữ A','chan-vay-jean-dang-chu-a-shp009','SHP009','Chân váy jean chữ A, cạp cao và dễ phối áo thun.','Denim cotton',399000,349000,91
  UNION ALL SELECT 'chan-vay','Chân váy xếp ly ngắn','chan-vay-xep-ly-ngan-shp010','SHP010','Chân váy xếp ly trẻ trung, co giãn nhẹ và dễ vận động.','Polyester',359000,319000,83
  UNION ALL SELECT 'ao-thun-nu','Áo thun croptop nữ','ao-thun-croptop-nu-shp011','SHP011','Áo thun croptop ôm nhẹ, chất cotton mềm thoáng.','Cotton jersey',249000,199000,146
  UNION ALL SELECT 'ao-thun-nu','Áo thun in họa tiết','ao-thun-in-hoa-tiet-nu-shp012','SHP012','Áo thun cổ tròn in họa tiết tinh tế, form thoải mái.','Cotton compact',279000,229000,105
  UNION ALL SELECT 'be-gai','Set váy bé gái áo thun','set-vay-be-gai-ao-thun-shp013','SHP013','Set váy hai món cho bé gái, áo thun mềm và váy xòe nhẹ.','Cotton pha',359000,299000,88
  UNION ALL SELECT 'be-gai','Đầm công chúa bé gái','dam-cong-chua-be-gai-shp014','SHP014','Đầm công chúa bé gái với tầng xòe nhẹ và màu sắc dễ thương.','Voan pha',429000,369000,74
  UNION ALL SELECT 'be-gai','Set thể thao bé gái','set-the-thao-be-gai-shp015','SHP015','Bộ áo thun và quần short co giãn, phù hợp học và chơi.','Cotton jersey',279000,239000,112
  UNION ALL SELECT 'be-gai','Áo thun bé gái in hình','ao-thun-be-gai-in-hinh-shp016','SHP016','Áo thun bé gái in họa tiết vui nhộn, cổ tròn và tay ngắn.','Cotton',199000,169000,137
  UNION ALL SELECT 'be-gai','Chân váy tutu bé gái','chan-vay-tutu-be-gai-shp017','SHP017','Chân váy tutu nhiều tầng, đai co giãn và dễ phối áo.','Voan cotton',289000,249000,93
  UNION ALL SELECT 'be-gai','Áo khoác cardigan bé gái','ao-khoac-cardigan-be-gai-shp018','SHP018','Cardigan bé gái len mỏng, giữ ấm nhẹ và dễ mặc lớp.','Len cotton',329000,289000,67
  UNION ALL SELECT 'be-gai','Quần jean bé gái ống rộng','quan-jean-be-gai-ong-rong-shp019','SHP019','Quần jean bé gái ống rộng, cạp co giãn và form thoải mái.','Denim cotton',359000,319000,101
  UNION ALL SELECT 'be-gai','Set váy ngủ bé gái','set-vay-ngu-be-gai-shp020','SHP020','Set váy ngủ mềm mại cho bé gái, họa tiết đáng yêu và co giãn nhẹ.','Cotton modal',249000,219000,79
) seed
JOIN categories category ON category.slug = seed.category_slug
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = seed.code);

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT p.id,
       CONCAT('/images/products/',
         CASE
           WHEN p.code='SHP001' THEN 'ao-kieu-01.jpg'
           WHEN p.code='SHP002' THEN 'ao-kieu-02.jpg'
           WHEN p.code='SHP003' THEN 'ao-kieu-03.jpg'
           WHEN p.code='SHP004' THEN 'vay-dam-01.jpg'
           WHEN p.code='SHP005' THEN 'vay-dam-02.jpg'
           WHEN p.code='SHP006' THEN 'quan-nu-01.jpg'
           WHEN p.code='SHP007' THEN 'quan-nu-02.jpg'
           WHEN p.code='SHP008' THEN 'ao-khoac-01.jpg'
           WHEN p.code='SHP009' THEN 'chan-vay-01.jpg'
           WHEN p.code='SHP010' THEN 'chan-vay-02.jpg'
           WHEN p.code='SHP011' THEN 'ao-thun-01.jpg'
           WHEN p.code='SHP012' THEN 'ao-thun-02.jpg'
           WHEN p.code='SHP013' THEN 'vay-dam-03.jpg'
           WHEN p.code='SHP014' THEN 'vay-dam-04.jpg'
           WHEN p.code='SHP015' THEN 'ao-thun-03.jpg'
           WHEN p.code='SHP016' THEN 'ao-thun-04.jpg'
           WHEN p.code='SHP017' THEN 'chan-vay-03.jpg'
           WHEN p.code='SHP018' THEN 'ao-khoac-02.jpg'
           WHEN p.code='SHP019' THEN 'quan-nu-03.jpg'
           WHEN p.code='SHP020' THEN 'vay-dam-05.jpg'
         END),
       1, TRUE
FROM products p
WHERE p.code LIKE 'SHP%'
  AND NOT EXISTS (
    SELECT 1 FROM product_images existing
    WHERE existing.product_id = p.id AND existing.is_primary = TRUE
  );

INSERT INTO product_variants (product_id, color_name, color_hex, size, stock)
SELECT p.id,
       CASE WHEN p.code >= 'SHP013' THEN 'Hồng' ELSE 'Trắng' END,
       CASE WHEN p.code >= 'SHP013' THEN '#d99aa5' ELSE '#f7f7f5' END,
       s.size, 8
FROM products p
JOIN (
  SELECT 'S' size
  UNION ALL SELECT 'M'
  UNION ALL SELECT 'L'
) s ON p.code LIKE 'SHP%'
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants existing
  WHERE existing.product_id = p.id
);

COMMIT;
