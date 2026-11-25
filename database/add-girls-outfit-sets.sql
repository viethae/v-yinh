USE ao_xinh;

START TRANSACTION;

UPDATE product_images pi
JOIN products p ON p.id = pi.product_id
SET pi.image_url = CASE
  WHEN p.code = 'SHP013' THEN '/images/products/girl-fashion-01.jpg'
  WHEN p.code = 'SHP014' THEN '/images/products/girl-fashion-02.jpg'
  WHEN p.code = 'SHP015' THEN '/images/products/girl-fashion-04.jpg'
  WHEN p.code = 'SHP016' THEN '/images/products/girl-fashion-06.jpg'
  WHEN p.code = 'SHP017' THEN '/images/products/girl-fashion-03.jpg'
  WHEN p.code = 'SHP018' THEN '/images/products/girl-fashion-05.jpg'
  WHEN p.code = 'SHP019' THEN '/images/products/girl-fashion-01.jpg'
  WHEN p.code = 'SHP020' THEN '/images/products/girl-fashion-03.jpg'
  WHEN p.code = 'SHP021' THEN '/images/products/girl-fashion-02.jpg'
END
WHERE p.code LIKE 'SHP0%'
  AND p.category_id = (SELECT id FROM categories WHERE slug = 'be-gai');

INSERT INTO products (
  category_id, name, slug, code, description, material,
  base_price, sale_price, is_new, is_featured, sold_count
)
SELECT c.id, s.name, s.slug, s.code, s.description, s.material,
       s.price, s.sale_price, TRUE, TRUE, s.sold
FROM categories c
JOIN (
  SELECT 'Bộ bé gái thun in hình hằng ngày' name, 'bo-be-gai-thun-in-hinh-hang-ngay' slug, 'SHP022' code, 'Bộ áo thun và quần short co giãn, họa tiết vui nhộn cho bé.' description, 'Cotton jersey' material, 259000 price, 219000 sale_price, 42 sold
  UNION ALL SELECT 'Set váy bé gái mặc đi chơi','set-vay-be-gai-mac-di-choi','SHP023','Set váy kèm áo nhẹ nhàng, form rộng vừa và dễ vận động.','Cotton pha',399000,349000,38
  UNION ALL SELECT 'Bộ thể thao bé gái năng động','bo-the-thao-be-gai-nang-dong','SHP024','Bộ thun thể thao hai món, thoáng mát và co giãn tốt.','Thun polyester',299000,249000,55
  UNION ALL SELECT 'Set áo hai dây kèm quần short','set-ao-hai-day-kem-quan-short-be-gai','SHP025','Set mùa hè hai món với áo hai dây mềm và quần short thoải mái.','Cotton modal',329000,279000,46
  UNION ALL SELECT 'Bộ áo cổ bèo phối quần hồng','bo-ao-co-beo-phoi-quan-hong','SHP026','Bộ hai món tông hồng dễ thương, áo cổ bèo và quần mềm.','Vải cotton pha',369000,319000,34
  UNION ALL SELECT 'Set váy công chúa bé gái','set-vay-cong-chua-be-gai','SHP027','Set váy xòe nhiều tầng và phụ kiện đi kèm cho dịp lễ.','Voan cotton',459000,399000,29
  UNION ALL SELECT 'Bộ đồ ngủ bé gái họa tiết thỏ','bo-do-ngu-be-gai-hoa-tiet-tho','SHP028','Bộ ngủ áo và quần mềm mại, họa tiết thỏ dễ thương.','Cotton modal',249000,209000,51
  UNION ALL SELECT 'Bộ cardigan bé gái đi mùa mát','bo-cardigan-be-gai-di-mua-mat','SHP029','Bộ áo cardigan kèm áo thun và chân váy, phối layer nhẹ nhàng.','Cotton len mỏng',429000,379000,31
) s
WHERE c.slug = 'be-gai'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.code = s.code);

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT p.id,
       CASE
         WHEN p.code = 'SHP022' THEN '/images/products/girl-fashion-01.jpg'
         WHEN p.code = 'SHP023' THEN '/images/products/girl-fashion-04.jpg'
         WHEN p.code = 'SHP024' THEN '/images/products/girl-fashion-06.jpg'
         WHEN p.code = 'SHP025' THEN '/images/products/girl-fashion-02.jpg'
         WHEN p.code = 'SHP026' THEN '/images/products/girl-fashion-05.jpg'
         WHEN p.code = 'SHP027' THEN '/images/products/girl-fashion-03.jpg'
         WHEN p.code = 'SHP028' THEN '/images/products/girl-fashion-06.jpg'
         WHEN p.code = 'SHP029' THEN '/images/products/girl-fashion-05.jpg'
       END,
       1, TRUE
FROM products p
WHERE p.code LIKE 'SHP02%'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.is_primary = TRUE
  );

INSERT INTO product_variants (product_id, color_name, color_hex, size, stock)
SELECT p.id, 'Hồng', '#d99aa5', s.size, 8
FROM products p
JOIN (
  SELECT 'S' size
  UNION ALL SELECT 'M'
  UNION ALL SELECT 'L'
) s
WHERE p.category_id = (SELECT id FROM categories WHERE slug = 'be-gai')
  AND p.code LIKE 'SHP%'
  AND NOT EXISTS (
    SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
  );

COMMIT;
