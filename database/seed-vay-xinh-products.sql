USE ao_xinh;

START TRANSACTION;

INSERT INTO categories (name, slug, parent_id, is_active)
SELECT seed.name, seed.slug, parent.id, TRUE
FROM categories parent
CROSS JOIN (
  SELECT 'Áo kiểu' AS name, 'ao-kieu' AS slug
  UNION ALL SELECT 'Váy đầm', 'vay-dam'
  UNION ALL SELECT 'Quần nữ', 'quan-nu'
  UNION ALL SELECT 'Áo khoác nữ', 'ao-khoac-nu'
  UNION ALL SELECT 'Chân váy', 'chan-vay'
  UNION ALL SELECT 'Áo thun nữ', 'ao-thun-nu'
) seed
WHERE parent.slug = 'nu'
  AND NOT EXISTS (SELECT 1 FROM categories existing WHERE existing.slug = seed.slug);

INSERT INTO products (
  category_id, name, slug, code, description, material,
  base_price, sale_price, is_new, is_featured, sold_count
)
SELECT category.id, seed.name, seed.slug, seed.code, seed.description, seed.material,
       seed.price, NULL, TRUE, TRUE, 0
FROM (
  SELECT 'ao-kieu' category_slug, 'Áo blouse voan nữ thanh lịch' name, 'ao-blouse-voan-nu-thanh-lich' slug, 'VX001' code, 'Áo blouse voan mỏng với phom nữ tính và tay dài; phù hợp phối cùng áo lót hai dây và quần hoặc chân váy cạp cao.' description, 'Voan mềm' material, 459000 price
  UNION ALL SELECT 'ao-kieu','Áo blouse xanh dương tối giản','ao-blouse-xanh-duong-toi-gian','VX002','Áo blouse xanh dương tay dài, phom gọn và cổ mở nhẹ; dễ kết hợp cùng quần sáng màu cho trang phục thường ngày.','Vải dệt mềm',429000
  UNION ALL SELECT 'ao-kieu','Áo blouse xanh lá tay dài','ao-blouse-xanh-la-tay-dai','VX003','Áo kiểu xanh lá tay dài với phom thoải mái; phối cùng quần jeans hoặc chân váy màu trung tính.','Cotton pha',489000
  UNION ALL SELECT 'ao-kieu','Áo blouse hoa đỏ thắt nút','ao-blouse-hoa-do-that-nut','VX004','Áo blouse nền đỏ họa tiết hoa sáng màu, thân trước thắt nút; thiết kế nổi bật khi phối với quần trắng hoặc chân váy trơn.','Cotton pha',389000
  UNION ALL SELECT 'ao-kieu','Áo blouse trắng tay lỡ','ao-blouse-trang-tay-lo','VX005','Áo blouse trắng cổ bẻ và tay dài, phom thanh lịch; dễ phối với chân váy hoặc quần tây.','Cotton pha',419000
  UNION ALL SELECT 'ao-thun-nu','Áo thun nữ đen basic','ao-thun-nu-den-basic','VX006','Áo thun nữ màu đen cổ tròn, phom rộng thoải mái và thiết kế tối giản; dễ phối với quần jeans hoặc chân váy.','Cotton jersey',279000
  UNION ALL SELECT 'vay-dam','Đầm xanh dáng midi','dam-xanh-dang-midi','VX007','Đầm xanh dương dáng midi với thiết kế gọn gàng; phù hợp cho buổi gặp mặt hoặc trang phục thường ngày chỉn chu.','Vải dệt mềm',699000
  UNION ALL SELECT 'vay-dam','Đầm đen dự tiệc','dam-den-du-tiec','VX008','Đầm đen nữ tính với phom thanh lịch; có thể phối cùng phụ kiện tối giản cho những buổi tối hoặc sự kiện.','Polyester pha',649000
  UNION ALL SELECT 'vay-dam','Đầm đỏ dáng xòe','dam-do-dang-xoe','VX009','Đầm đỏ nổi bật với chân váy xòe và phom nhấn eo; phù hợp dự tiệc hoặc những dịp cần trang phục ấn tượng.','Vải dệt mềm',629000
  UNION ALL SELECT 'vay-dam','Đầm len dệt kim dáng dài','dam-len-det-kim-dang-dai','VX010','Đầm len dệt kim dáng dài, tay dài và phom ôm vừa; thích hợp mặc trong thời tiết mát hoặc phối layer.','Len dệt kim',729000
  UNION ALL SELECT 'vay-dam','Đầm đen dáng thanh lịch','dam-den-dang-thanh-lich','VX011','Đầm đen phom nữ tính, tạo điểm nhấn bằng đường nét tối giản; phù hợp mặc đi làm hoặc dự buổi gặp mặt.','Polyester pha',579000
  UNION ALL SELECT 'ao-khoac-nu','Áo blazer nữ phong cách công sở','ao-blazer-nu-phong-cach-cong-so','VX012','Áo blazer nữ phom chỉn chu với ve áo cổ điển; phối cùng quần tây hoặc chân váy cho phong cách công sở hiện đại.','Polyester pha viscose',899000
  UNION ALL SELECT 'quan-nu','Quần nữ ống suông màu hồng','quan-nu-ong-suong-mau-hong','VX013','Quần dài nữ màu hồng, ống suông và phom hiện đại; phối cùng áo sáng màu hoặc blazer đồng tông.','Polyester pha',559000
  UNION ALL SELECT 'quan-nu','Quần ống rộng họa tiết lá xanh','quan-ong-rong-hoa-tiet-la-xanh','VX014','Quần nữ ống rộng họa tiết lá xanh nổi bật; phối cùng áo trơn màu để cân bằng trang phục.','Vải dệt nhẹ',529000
  UNION ALL SELECT 'quan-nu','Quần nữ ống đứng màu trắng','quan-nu-ong-dung-mau-trang','VX015','Quần dài nữ màu trắng, phom ống đứng và dễ phối; kết hợp cùng áo kiểu hoặc áo thun cho vẻ ngoài sáng sủa.','Cotton pha',599000
  UNION ALL SELECT 'quan-nu','Quần nữ ống suông màu be','quan-nu-ong-suong-mau-be','VX016','Quần dài màu be phom suông, thiết kế tối giản; phù hợp kết hợp với áo tối màu hoặc sơ mi.','Vải dệt mềm',499000
  UNION ALL SELECT 'quan-nu','Quần nữ ống rộng màu đen','quan-nu-ong-rong-mau-den','VX017','Quần đen ống rộng với phom hiện đại; phối cùng áo ôm gọn hoặc áo kiểu để tạo tỷ lệ cân đối.','Vải dệt mềm',429000
  UNION ALL SELECT 'chan-vay','Chân váy kẻ caro xanh','chan-vay-ke-caro-xanh','VX018','Chân váy xanh kẻ caro dáng nữ tính; phối cùng áo blouse trắng hoặc áo thun trơn cho trang phục thanh lịch.','Vải dệt mềm',349000
  UNION ALL SELECT 'ao-khoac-nu','Áo khoác da nữ dáng ngắn','ao-khoac-da-nu-dang-ngan','VX019','Áo khoác da nữ màu đen, phom ngắn và cổ bẻ; tạo điểm nhấn cá tính khi phối cùng váy hoặc quần jeans.','Da tổng hợp',699000
  UNION ALL SELECT 'ao-khoac-nu','Áo blazer nữ xanh thanh lịch','ao-blazer-nu-xanh-thanh-lich','VX020','Blazer nữ màu xanh, ve áo cổ điển và phom chỉn chu; phù hợp phối đồ công sở hoặc trang phục smart-casual.','Polyester pha viscose',799000
  UNION ALL SELECT 'ao-khoac-nu','Áo khoác gió nữ màu đỏ','ao-khoac-gio-nu-mau-do','VX021','Áo khoác nữ màu đỏ, khóa kéo phía trước và kiểu dáng năng động; thích hợp khoác ngoài trang phục thường ngày.','Polyester',499000
  UNION ALL SELECT 'ao-khoac-nu','Áo bomber nữ màu tím','ao-bomber-nu-mau-tim','VX022','Áo bomber nữ màu tím, phom ngắn và phong cách trẻ trung; phối cùng quần tối màu cho trang phục dạo phố.','Polyester',899000
  UNION ALL SELECT 'chan-vay','Chân váy midi nữ thanh lịch','chan-vay-midi-nu-thanh-lich','VX023','Chân váy midi nữ với phom mềm mại, dễ phối cùng blouse hoặc áo thun; phù hợp đi chơi và gặp gỡ.','Vải dệt mềm',429000
  UNION ALL SELECT 'chan-vay','Chân váy đen dáng chữ A','chan-vay-den-dang-chu-a','VX024','Chân váy đen nữ dáng chữ A, dễ kết hợp với áo sáng màu hoặc sơ mi cho phong cách thanh lịch.','Polyester pha',459000
  UNION ALL SELECT 'chan-vay','Chân váy họa tiết nổi bật','chan-vay-hoa-tiet-noi-bat','VX025','Chân váy họa tiết nổi bật, phối cùng áo trơn màu để tạo điểm nhấn; phù hợp với trang phục dạo phố.','Vải dệt nhẹ',499000
  UNION ALL SELECT 'chan-vay','Chân váy midi nâu dáng dài','chan-vay-midi-nau-dang-dai','VX026','Chân váy dài màu nâu với phom rũ nhẹ; dễ kết hợp với áo blouse, áo thun hoặc áo khoác ngắn.','Vải dệt mềm',479000
  UNION ALL SELECT 'ao-thun-nu','Áo thun nữ cotton trắng cơ bản','ao-thun-nu-cotton-trang-co-ban','VX027','Áo thun cổ tròn tay ngắn phom regular, bề mặt cotton mềm và thoáng; món đồ cơ bản dễ phối cùng nhiều trang phục.','Cotton',249000
  UNION ALL SELECT 'ao-thun-nu','Áo thun nữ đen tối giản','ao-thun-nu-den-toi-gian','VX028','Áo thun đen cổ tròn, đường may gọn và phom suông thoải mái; dễ mặc riêng hoặc phối layer.','Cotton compact',269000
  UNION ALL SELECT 'ao-thun-nu','Áo thun nữ hồng pastel','ao-thun-nu-hong-pastel','VX029','Áo thun màu hồng pastel với phom vừa và tay ngắn; chất vải mềm, tạo điểm nhấn nhẹ nhàng cho trang phục thường ngày.','Cotton pha modal',279000
  UNION ALL SELECT 'ao-thun-nu','Áo thun nữ cổ tròn tay lỡ','ao-thun-nu-co-tron-tay-lo','VX030','Áo thun cổ tròn tay lỡ phom rộng vừa, dễ vận động và phối cùng quần jeans hoặc chân váy.','Cotton jersey',299000
) seed
JOIN categories category ON category.slug = seed.category_slug
WHERE NOT EXISTS (SELECT 1 FROM products existing WHERE existing.code = seed.code);

UPDATE products p
JOIN categories category ON category.slug = 'ao-thun-nu'
SET p.category_id = category.id,
    p.name = 'Áo thun nữ đen basic',
    p.slug = 'ao-thun-nu-den-basic',
    p.description = 'Áo thun nữ màu đen cổ tròn, phom rộng thoải mái và thiết kế tối giản; dễ phối với quần jeans hoặc chân váy.',
    p.material = 'Cotton jersey',
    p.base_price = 279000
WHERE p.code = 'VX006'
  AND p.slug IN ('ao-blouse-xanh-hoa-tiet-hoa', 'ao-thun-nu-den-basic');

UPDATE products p
JOIN categories category ON category.slug = 'ao-khoac-nu'
SET p.category_id = category.id,
    p.name = 'Áo blazer nữ phong cách công sở',
    p.slug = 'ao-blazer-nu-phong-cach-cong-so',
    p.description = 'Áo blazer nữ phom chỉn chu với ve áo cổ điển; phối cùng quần tây hoặc chân váy cho phong cách công sở hiện đại.',
    p.material = 'Polyester pha viscose',
    p.base_price = 899000
WHERE p.code = 'VX012'
  AND p.slug IN ('dam-xanh-duong-nu-tinh', 'ao-blazer-nu-phong-cach-cong-so');

UPDATE products p
JOIN categories category ON category.slug = 'chan-vay'
SET p.category_id = category.id,
    p.name = 'Chân váy kẻ caro xanh',
    p.slug = 'chan-vay-ke-caro-xanh',
    p.description = 'Chân váy xanh kẻ caro dáng nữ tính; phối cùng áo blouse trắng hoặc áo thun trơn cho trang phục thanh lịch.',
    p.material = 'Vải dệt mềm',
    p.base_price = 349000
WHERE p.code = 'VX018'
  AND p.slug IN ('quan-nu-den-dang-suong', 'chan-vay-ke-caro-xanh');

UPDATE product_variants variants
JOIN products p ON p.id = variants.product_id
SET variants.color_name = 'Đen', variants.color_hex = '#252525'
WHERE p.code = 'VX006' AND variants.color_name = 'Xanh ngọc';

UPDATE product_variants variants
JOIN products p ON p.id = variants.product_id
SET variants.color_name = 'Hồng', variants.color_hex = '#d99aa5'
WHERE p.code = 'VX012' AND variants.color_name = 'Xanh dương';

UPDATE product_variants variants
JOIN products p ON p.id = variants.product_id
SET variants.color_name = 'Đen', variants.color_hex = '#252525'
WHERE p.code = 'VX012' AND variants.color_name = 'Navy';

UPDATE product_variants variants
JOIN products p ON p.id = variants.product_id
SET variants.color_name = 'Xanh caro', variants.color_hex = '#6689a3'
WHERE p.code = 'VX018' AND variants.color_name = 'Đen';

UPDATE product_variants variants
JOIN products p ON p.id = variants.product_id
SET variants.color_name = 'Navy', variants.color_hex = '#26364d'
WHERE p.code = 'VX018' AND variants.color_name = 'Xám';

UPDATE product_images images
JOIN products p ON p.id = images.product_id
JOIN (
  SELECT 'VX006' code, 'ao-thun-05.jpg' asset
  UNION ALL SELECT 'VX012', 'ao-khoac-05.jpg'
  UNION ALL SELECT 'VX018', 'chan-vay-05.jpg'
) changed ON changed.code = p.code
SET images.image_url = CONCAT('/images/products/', changed.asset)
WHERE images.is_primary = TRUE;

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT p.id, CONCAT('/images/products/', images.asset), 1, TRUE
FROM products p
JOIN (
  SELECT 'VX001' code, 'ao-kieu-01.jpg' asset UNION ALL SELECT 'VX002','ao-kieu-02.jpg'
  UNION ALL SELECT 'VX003','ao-kieu-03.jpg' UNION ALL SELECT 'VX004','ao-kieu-04.jpg'
  UNION ALL SELECT 'VX005','ao-kieu-05.jpg' UNION ALL SELECT 'VX006','ao-thun-05.jpg'
  UNION ALL SELECT 'VX007','vay-dam-01.jpg' UNION ALL SELECT 'VX008','vay-dam-02.jpg'
  UNION ALL SELECT 'VX009','vay-dam-03.jpg' UNION ALL SELECT 'VX010','vay-dam-04.jpg'
  UNION ALL SELECT 'VX011','vay-dam-05.jpg' UNION ALL SELECT 'VX012','ao-khoac-05.jpg'
  UNION ALL SELECT 'VX013','quan-nu-01.jpg' UNION ALL SELECT 'VX014','quan-nu-02.jpg'
  UNION ALL SELECT 'VX015','quan-nu-03.jpg' UNION ALL SELECT 'VX016','quan-nu-04.jpg'
  UNION ALL SELECT 'VX017','quan-nu-05.jpg' UNION ALL SELECT 'VX018','chan-vay-05.jpg'
  UNION ALL SELECT 'VX019','ao-khoac-01.jpg' UNION ALL SELECT 'VX020','ao-khoac-02.jpg'
  UNION ALL SELECT 'VX021','ao-khoac-03.jpg' UNION ALL SELECT 'VX022','ao-khoac-04.jpg'
  UNION ALL SELECT 'VX023','chan-vay-01.jpg' UNION ALL SELECT 'VX024','chan-vay-02.jpg'
  UNION ALL SELECT 'VX025','chan-vay-03.jpg' UNION ALL SELECT 'VX026','chan-vay-04.jpg'
  UNION ALL SELECT 'VX027','ao-thun-01.jpg' UNION ALL SELECT 'VX028','ao-thun-02.jpg'
  UNION ALL SELECT 'VX029','ao-thun-03.jpg' UNION ALL SELECT 'VX030','ao-thun-04.jpg'
) images ON images.code = p.code
WHERE NOT EXISTS (
  SELECT 1 FROM product_images existing WHERE existing.product_id = p.id AND existing.is_primary = TRUE
);

INSERT INTO product_variants (product_id, color_name, color_hex, size, stock)
SELECT p.id, colors.color_name, colors.color_hex, sizes.size, 8
FROM products p
JOIN (
  SELECT 'VX001' code, 'Xanh nhạt' color_name, '#b8cdbb' color_hex UNION ALL SELECT 'VX001','Kem','#f2e6d3'
  UNION ALL SELECT 'VX002','Xanh dương','#6689a3' UNION ALL SELECT 'VX002','Be','#d2bda5'
  UNION ALL SELECT 'VX003','Xanh lá','#64734d' UNION ALL SELECT 'VX003','Đen','#252525'
  UNION ALL SELECT 'VX004','Đỏ hoa','#a8393e' UNION ALL SELECT 'VX004','Trắng','#f7f7f5'
  UNION ALL SELECT 'VX005','Trắng','#f7f7f5' UNION ALL SELECT 'VX005','Xanh dương','#6689a3'
  UNION ALL SELECT 'VX006','Đen','#252525' UNION ALL SELECT 'VX006','Trắng','#f7f7f5'
  UNION ALL SELECT 'VX007','Xanh dương','#6689a3' UNION ALL SELECT 'VX007','Đen','#252525'
  UNION ALL SELECT 'VX008','Đen','#252525' UNION ALL SELECT 'VX008','Trắng','#f7f7f5'
  UNION ALL SELECT 'VX009','Đỏ','#a8393e' UNION ALL SELECT 'VX009','Đỏ rượu','#742f36'
  UNION ALL SELECT 'VX010','Xám','#858585' UNION ALL SELECT 'VX010','Be','#d2bda5'
  UNION ALL SELECT 'VX011','Đen','#252525' UNION ALL SELECT 'VX011','Navy','#26364d'
  UNION ALL SELECT 'VX012','Hồng','#d99aa5' UNION ALL SELECT 'VX012','Đen','#252525'
  UNION ALL SELECT 'VX013','Hồng','#d99aa5' UNION ALL SELECT 'VX013','Be','#d2bda5'
  UNION ALL SELECT 'VX014','Xanh lá họa tiết','#64734d' UNION ALL SELECT 'VX014','Kem','#f2e6d3'
  UNION ALL SELECT 'VX015','Trắng','#f7f7f5' UNION ALL SELECT 'VX015','Be','#d2bda5'
  UNION ALL SELECT 'VX016','Be','#d2bda5' UNION ALL SELECT 'VX016','Trắng','#f7f7f5'
  UNION ALL SELECT 'VX017','Đen','#252525' UNION ALL SELECT 'VX017','Navy','#26364d'
  UNION ALL SELECT 'VX018','Xanh caro','#6689a3' UNION ALL SELECT 'VX018','Navy','#26364d'
  UNION ALL SELECT 'VX019','Đen','#252525' UNION ALL SELECT 'VX019','Nâu','#80634d'
  UNION ALL SELECT 'VX020','Xanh dương','#6689a3' UNION ALL SELECT 'VX020','Đen','#252525'
  UNION ALL SELECT 'VX021','Đỏ','#a8393e' UNION ALL SELECT 'VX021','Đen','#252525'
  UNION ALL SELECT 'VX022','Tím','#77588b' UNION ALL SELECT 'VX022','Đen','#252525'
  UNION ALL SELECT 'VX023','Xanh dương','#6689a3' UNION ALL SELECT 'VX023','Trắng','#f7f7f5'
  UNION ALL SELECT 'VX024','Đen','#252525' UNION ALL SELECT 'VX024','Trắng','#f7f7f5'
  UNION ALL SELECT 'VX025','Nhiều màu','#f2e6d3' UNION ALL SELECT 'VX025','Đen','#252525'
  UNION ALL SELECT 'VX026','Nâu','#80634d' UNION ALL SELECT 'VX026','Đen','#252525'
  UNION ALL SELECT 'VX027','Trắng','#f7f7f5' UNION ALL SELECT 'VX027','Hồng pastel','#e8a9b5'
  UNION ALL SELECT 'VX028','Đen','#252525' UNION ALL SELECT 'VX028','Trắng','#f7f7f5'
  UNION ALL SELECT 'VX029','Hồng pastel','#e8a9b5' UNION ALL SELECT 'VX029','Trắng','#f7f7f5'
  UNION ALL SELECT 'VX030','Trắng','#f7f7f5' UNION ALL SELECT 'VX030','Đen','#252525'
) colors ON colors.code = p.code
CROSS JOIN (
  SELECT 'S' size UNION ALL SELECT 'M' UNION ALL SELECT 'L' UNION ALL SELECT 'XL'
) sizes
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants existing
  WHERE existing.product_id = p.id AND existing.color_name = colors.color_name AND existing.size = sizes.size
);

COMMIT;
