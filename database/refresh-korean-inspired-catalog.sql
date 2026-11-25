USE ao_xinh;

START TRANSACTION;

UPDATE categories
SET is_active = FALSE
WHERE slug IN ('nam', 'tre-em', 'ao', 'quan', 'phu-kien');

UPDATE products p
JOIN (
  SELECT 'AX001' code, 'nu' category_slug, 'Áo thun nữ Hàn Quốc cổ tròn thanh lịch' name, 'ao-thun-nu-han-quoc-co-tron-thanh-lich' slug, 'Áo thun cổ tròn phom gọn, chất vải mềm và dễ phối cùng quần jeans hoặc chân váy.' description, 'Cotton jersey' material, 'ao-thun-02.jpg' image, 'ao-thun-01.jpg' second_image
  UNION ALL SELECT 'AX002','nu','Áo sơ mi linen nữ cổ mềm','ao-so-mi-linen-nu-co-mem','Sơ mi linen phom suông nhẹ, cổ mềm và sắc màu trung tính cho phong cách thường ngày tinh tế.','Linen pha','ao-kieu-05.jpg','ao-kieu-02.jpg'
  UNION ALL SELECT 'AX003','nu','Áo blouse nữ tay bồng pastel','ao-blouse-nu-tay-bong-pastel','Blouse tay bồng với đường nét mềm mại, dễ phối cùng quần cạp cao hoặc chân váy.','Voan pha','ao-kieu-01.jpg','ao-kieu-03.jpg'
  UNION ALL SELECT 'AX004','nu','Áo polo nữ dệt gân tối giản','ao-polo-nu-det-gan-toi-gian','Áo polo nữ phom vừa, cổ dệt gân và thiết kế tối giản dễ mặc hằng ngày.','Cotton pique','ao-thun-03.jpg','ao-thun-05.jpg'
  UNION ALL SELECT 'AX005','be-gai','Áo khoác denim bé gái dáng gọn','ao-khoac-denim-be-gai-dang-gon','Áo khoác denim bé gái dễ phối với váy hoặc quần dài trong những ngày mát.','Denim cotton','girl-fashion-01.jpg','girl-fashion-04.jpg'
  UNION ALL SELECT 'AX006','nu','Áo gile len nữ cổ V','ao-gile-len-nu-co-v','Gile len cổ V phom rộng vừa, phù hợp mặc layer cùng sơ mi hoặc áo thun.','Len cotton','ao-kieu-03.jpg','ao-kieu-05.jpg'
  UNION ALL SELECT 'AX007','nu','Áo blouse voan nữ tay lửng','ao-blouse-voan-nu-tay-lung','Blouse voan tay lửng nhẹ nhàng, tạo điểm nhấn thanh lịch cho trang phục công sở.','Voan mềm','ao-kieu-04.jpg','ao-kieu-01.jpg'
  UNION ALL SELECT 'AX008','nu','Áo thun nữ phom rộng tối giản','ao-thun-nu-phom-rong-toi-gian','Áo thun nữ phom rộng thoải mái, thiết kế tối giản dễ phối với nhiều kiểu quần.','Cotton compact','ao-thun-05.jpg','ao-thun-03.jpg'
  UNION ALL SELECT 'AX009','be-gai','Áo cardigan dệt kim bé gái','ao-cardigan-det-kim-be-gai','Cardigan dệt kim mỏng cho bé gái, dễ mặc ngoài váy hoặc áo thun.','Len cotton','girl-fashion-03.jpg','girl-fashion-05.jpg'
  UNION ALL SELECT 'AX010','nu','Áo sát nách nữ mùa hè','ao-sat-nach-nu-mua-he','Áo sát nách phom gọn, chất vải nhẹ và dễ kết hợp cùng sơ mi khoác ngoài.','Cotton pha','ao-thun-01.jpg','ao-thun-04.jpg'
  UNION ALL SELECT 'AX011','nu','Quần jean nữ ống suông cạp cao','quan-jean-nu-ong-suong-cap-cao','Quần jean ống suông cạp cao, phom đứng và dễ phối cùng áo blouse hoặc áo thun.','Denim cotton','quan-nu-01.jpg','quan-nu-05.jpg'
  UNION ALL SELECT 'AX012','nu','Quần short kaki nữ cạp cao','quan-short-kaki-nu-cap-cao','Quần short kaki nữ cạp cao, phom gọn và thuận tiện cho ngày hè.','Kaki cotton','quan-nu-02.jpg','quan-nu-03.jpg'
  UNION ALL SELECT 'AX013','nu','Quần vải nữ ống rộng thanh lịch','quan-vai-nu-ong-rong-thanh-lich','Quần vải ống rộng với đường ly nhẹ, tạo dáng thanh thoát khi phối cùng áo ôm gọn.','Vải dệt mềm','quan-nu-03.jpg','quan-nu-04.jpg'
  UNION ALL SELECT 'AX014','nu','Quần tây nữ ống đứng','quan-tay-nu-ong-dung','Quần tây nữ ống đứng, phom chỉn chu phù hợp trang phục công sở hiện đại.','Polyester pha','quan-nu-04.jpg','quan-nu-01.jpg'
  UNION ALL SELECT 'AX015','be-gai','Set áo thun và quần short bé gái','set-ao-thun-quan-short-be-gai','Set áo thun và quần short cho bé gái, phom thoải mái cho hoạt động thường ngày.','Cotton jersey','girl-fashion-04.jpg','girl-fashion-01.jpg'
  UNION ALL SELECT 'AX016','nu','Quần jogger nữ phom gọn','quan-jogger-nu-phom-gon','Quần jogger nữ có độ co giãn nhẹ, phom gọn và dễ phối đồ năng động.','Cotton pha','quan-nu-05.jpg','quan-nu-02.jpg'
  UNION ALL SELECT 'AX017','nu','Quần nữ ống loe phong cách công sở','quan-nu-ong-loe-phong-cach-cong-so','Quần ống loe nữ cạp cao, tạo đường nét cân đối khi phối với blouse hoặc blazer.','Vải dệt co giãn','quan-nu-01.jpg','quan-nu-04.jpg'
  UNION ALL SELECT 'AX018','be-gai','Quần jean bé gái ống đứng','quan-jean-be-gai-ong-dung','Quần jean bé gái phom đứng, dễ phối cùng áo thun và áo khoác nhẹ.','Denim cotton','girl-fashion-01.jpg','girl-fashion-06.jpg'
  UNION ALL SELECT 'AX019','be-gai','Quần linen bé gái lưng thun','quan-linen-be-gai-lung-thun','Quần linen nhẹ cho bé gái, lưng thun dễ mặc và thoáng mát.','Linen cotton','girl-fashion-05.jpg','girl-fashion-04.jpg'
  UNION ALL SELECT 'AX020','nu','Quần kaki nữ ống rộng','quan-kaki-nu-ong-rong','Quần kaki nữ ống rộng, sắc màu trung tính và phom dễ phối hằng ngày.','Kaki cotton','quan-nu-04.jpg','quan-nu-03.jpg'
  UNION ALL SELECT 'AX021','nu','Váy midi nữ hoa nhí','vay-midi-nu-hoa-nhi','Váy midi hoa nhí với phom rũ nhẹ, phù hợp cho những dịp dạo phố hoặc gặp gỡ.','Voan pha','vay-dam-01.jpg','vay-dam-03.jpg'
  UNION ALL SELECT 'AX022','nu','Đầm suông nữ tay phồng','dam-suong-nu-tay-phong','Đầm suông tay phồng, đường cắt tối giản và cảm giác thoải mái khi mặc.','Vải dệt mềm','vay-dam-02.jpg','vay-dam-01.jpg'
  UNION ALL SELECT 'AX023','nu','Chân váy nữ xếp ly dáng midi','chan-vay-nu-xep-ly-dang-midi','Chân váy xếp ly dáng midi, dễ kết hợp với áo len mỏng hoặc sơ mi.','Polyester pha','chan-vay-02.jpg','chan-vay-04.jpg'
  UNION ALL SELECT 'AX024','nu','Áo khoác bomber nữ dáng ngắn','ao-khoac-bomber-nu-dang-ngan','Bomber nữ dáng ngắn, tạo điểm nhấn trẻ trung khi phối cùng quần cạp cao.','Polyester','ao-khoac-01.jpg','ao-khoac-03.jpg'
  UNION ALL SELECT 'AX025','nu','Blazer nữ phom relaxed','blazer-nu-phom-relaxed','Blazer nữ phom relaxed với ve áo cổ điển, phù hợp phối đồ công sở hoặc dạo phố.','Polyester pha viscose','ao-khoac-05.jpg','ao-khoac-02.jpg'
  UNION ALL SELECT 'AX026','nu','Áo len nữ cổ tròn mềm mại','ao-len-nu-co-tron-mem-mai','Áo len cổ tròn phom vừa, dễ mặc riêng hoặc phối layer trong mùa mát.','Len cotton','ao-kieu-02.jpg','ao-kieu-03.jpg'
  UNION ALL SELECT 'AX027','be-gai','Set váy hoa bé gái','set-vay-hoa-be-gai','Set váy hoa nhẹ nhàng cho bé gái, phom thoải mái và dễ vận động.','Cotton pha','girl-fashion-02.jpg','girl-fashion-05.jpg'
  UNION ALL SELECT 'AX028','be-gai','Bộ áo quần bé gái phong cách casual','bo-ao-quan-be-gai-phong-cach-casual','Bộ áo và quần bé gái phom thoải mái, phù hợp đi học hoặc dạo chơi.','Cotton jersey','girl-fashion-01.jpg','girl-fashion-06.jpg'
  UNION ALL SELECT 'AX029','be-gai','Đầm dài tay bé gái thanh lịch','dam-dai-tay-be-gai-thanh-lich','Đầm dài tay cho bé gái với kiểu dáng nhẹ nhàng, phù hợp những ngày thời tiết mát.','Cotton pha','girl-fashion-03.jpg','girl-fashion-05.jpg'
  UNION ALL SELECT 'AX030','nu','Đầm midi nữ hai dây tối giản','dam-midi-nu-hai-day-toi-gian','Đầm midi hai dây phom suông nhẹ, phù hợp phối cùng cardigan hoặc áo khoác mỏng.','Vải dệt mềm','vay-dam-03.jpg','vay-dam-04.jpg'
  UNION ALL SELECT 'AX031','nu','Áo blouse nữ cổ tròn','ao-blouse-nu-co-tron','Áo blouse cổ tròn với phom mềm mại, phù hợp kết hợp cùng chân váy hoặc quần suông.','Cotton pha','ao-kieu-05.jpg','ao-kieu-01.jpg'
  UNION ALL SELECT 'AX032','nu','Set váy nữ hai mảnh pastel','set-vay-nu-hai-manh-pastel','Set hai mảnh tông pastel, phối đồng bộ gọn gàng cho phong cách nữ tính.','Polyester pha','vay-dam-01.jpg','vay-dam-03.jpg'
  UNION ALL SELECT 'AX033','nu','Sơ mi nữ phom relaxed','so-mi-nu-phom-relaxed','Sơ mi nữ phom relaxed, cổ điển và dễ phối cùng quần vải hoặc chân váy.','Cotton poplin','ao-kieu-02.jpg','ao-kieu-04.jpg'
  UNION ALL SELECT 'AX034','nu','Quần chinos nữ ống thẳng','quan-chinos-nu-ong-thang','Quần chinos nữ ống thẳng, sắc màu trung tính và phom gọn cho trang phục thường ngày.','Cotton twill','quan-nu-04.jpg','quan-nu-01.jpg'
  UNION ALL SELECT 'AX035','be-gai','Áo polo bé gái cổ dệt','ao-polo-be-gai-co-det','Áo polo bé gái cổ dệt, chất vải thoáng và dễ phối với chân váy hoặc quần short.','Cotton pique','girl-fashion-04.jpg','girl-fashion-01.jpg'
  UNION ALL SELECT 'AX036','be-gai','Set áo thun và quần bé gái','set-ao-thun-quan-be-gai','Set áo thun và quần bé gái phom thoải mái, phù hợp mặc thường ngày.','Cotton jersey','girl-fashion-06.jpg','girl-fashion-04.jpg'
) catalog ON catalog.code = p.code
JOIN categories c ON c.slug = catalog.category_slug
SET p.category_id = c.id,
    p.name = catalog.name,
    p.slug = catalog.slug,
    p.description = catalog.description,
    p.material = catalog.material;

UPDATE products p
JOIN categories c ON c.slug = 'nu'
SET p.category_id = c.id
WHERE p.code IN ('SHP001','SHP002','SHP003','SHP004','SHP005','SHP006',
                 'SHP007','SHP008','SHP009','SHP010','SHP011','SHP012');

UPDATE products p
JOIN categories c ON c.slug = 'be-gai'
SET p.category_id = c.id
WHERE p.code IN ('SHP013','SHP014','SHP015','SHP016','SHP017','SHP018',
                 'SHP019','SHP020','SHP021','SHP022','SHP023','SHP024',
                 'SHP025','SHP026','SHP027','SHP028','SHP029');

UPDATE product_images pi
JOIN products p ON p.id = pi.product_id
JOIN (
  SELECT 'AX001' code,'ao-thun-02.jpg' image,'ao-thun-01.jpg' second_image
  UNION ALL SELECT 'AX002','ao-kieu-05.jpg','ao-kieu-02.jpg'
  UNION ALL SELECT 'AX003','ao-kieu-01.jpg','ao-kieu-03.jpg'
  UNION ALL SELECT 'AX004','ao-thun-03.jpg','ao-thun-05.jpg'
  UNION ALL SELECT 'AX005','girl-fashion-01.jpg','girl-fashion-04.jpg'
  UNION ALL SELECT 'AX006','ao-kieu-03.jpg','ao-kieu-05.jpg'
  UNION ALL SELECT 'AX007','ao-kieu-04.jpg','ao-kieu-01.jpg'
  UNION ALL SELECT 'AX008','ao-thun-05.jpg','ao-thun-03.jpg'
  UNION ALL SELECT 'AX009','girl-fashion-03.jpg','girl-fashion-05.jpg'
  UNION ALL SELECT 'AX010','ao-thun-01.jpg','ao-thun-04.jpg'
  UNION ALL SELECT 'AX011','quan-nu-01.jpg','quan-nu-05.jpg'
  UNION ALL SELECT 'AX012','quan-nu-02.jpg','quan-nu-03.jpg'
  UNION ALL SELECT 'AX013','quan-nu-03.jpg','quan-nu-04.jpg'
  UNION ALL SELECT 'AX014','quan-nu-04.jpg','quan-nu-01.jpg'
  UNION ALL SELECT 'AX015','girl-fashion-04.jpg','girl-fashion-01.jpg'
  UNION ALL SELECT 'AX016','quan-nu-05.jpg','quan-nu-02.jpg'
  UNION ALL SELECT 'AX017','quan-nu-01.jpg','quan-nu-04.jpg'
  UNION ALL SELECT 'AX018','girl-fashion-01.jpg','girl-fashion-06.jpg'
  UNION ALL SELECT 'AX019','girl-fashion-05.jpg','girl-fashion-04.jpg'
  UNION ALL SELECT 'AX020','quan-nu-04.jpg','quan-nu-03.jpg'
  UNION ALL SELECT 'AX021','vay-dam-01.jpg','vay-dam-03.jpg'
  UNION ALL SELECT 'AX022','vay-dam-02.jpg','vay-dam-01.jpg'
  UNION ALL SELECT 'AX023','chan-vay-02.jpg','chan-vay-04.jpg'
  UNION ALL SELECT 'AX024','ao-khoac-01.jpg','ao-khoac-03.jpg'
  UNION ALL SELECT 'AX025','ao-khoac-05.jpg','ao-khoac-02.jpg'
  UNION ALL SELECT 'AX026','ao-kieu-02.jpg','ao-kieu-03.jpg'
  UNION ALL SELECT 'AX027','girl-fashion-02.jpg','girl-fashion-05.jpg'
  UNION ALL SELECT 'AX028','girl-fashion-01.jpg','girl-fashion-06.jpg'
  UNION ALL SELECT 'AX029','girl-fashion-03.jpg','girl-fashion-05.jpg'
  UNION ALL SELECT 'AX030','vay-dam-03.jpg','vay-dam-04.jpg'
  UNION ALL SELECT 'AX031','ao-kieu-05.jpg','ao-kieu-01.jpg'
  UNION ALL SELECT 'AX032','vay-dam-01.jpg','vay-dam-03.jpg'
  UNION ALL SELECT 'AX033','ao-kieu-02.jpg','ao-kieu-04.jpg'
  UNION ALL SELECT 'AX034','quan-nu-04.jpg','quan-nu-01.jpg'
  UNION ALL SELECT 'AX035','girl-fashion-04.jpg','girl-fashion-01.jpg'
  UNION ALL SELECT 'AX036','girl-fashion-06.jpg','girl-fashion-04.jpg'
  UNION ALL SELECT 'SHP001','ao-kieu-01.jpg','ao-kieu-02.jpg'
  UNION ALL SELECT 'SHP002','ao-kieu-02.jpg','ao-kieu-04.jpg'
  UNION ALL SELECT 'SHP003','ao-kieu-03.jpg','ao-kieu-05.jpg'
  UNION ALL SELECT 'SHP004','vay-dam-01.jpg','vay-dam-03.jpg'
  UNION ALL SELECT 'SHP005','vay-dam-02.jpg','vay-dam-04.jpg'
  UNION ALL SELECT 'SHP006','quan-nu-01.jpg','quan-nu-03.jpg'
  UNION ALL SELECT 'SHP007','quan-nu-02.jpg','quan-nu-04.jpg'
  UNION ALL SELECT 'SHP008','ao-khoac-01.jpg','ao-khoac-03.jpg'
  UNION ALL SELECT 'SHP009','chan-vay-01.jpg','chan-vay-04.jpg'
  UNION ALL SELECT 'SHP010','chan-vay-02.jpg','chan-vay-05.jpg'
  UNION ALL SELECT 'SHP011','ao-thun-01.jpg','ao-thun-03.jpg'
  UNION ALL SELECT 'SHP012','ao-thun-02.jpg','ao-thun-04.jpg'
  UNION ALL SELECT 'SHP013','girl-fashion-01.jpg','girl-fashion-04.jpg'
  UNION ALL SELECT 'SHP014','girl-fashion-02.jpg','girl-fashion-05.jpg'
  UNION ALL SELECT 'SHP015','girl-fashion-04.jpg','girl-fashion-06.jpg'
  UNION ALL SELECT 'SHP016','girl-fashion-06.jpg','girl-fashion-01.jpg'
  UNION ALL SELECT 'SHP017','girl-fashion-03.jpg','girl-fashion-05.jpg'
  UNION ALL SELECT 'SHP018','girl-fashion-05.jpg','girl-fashion-01.jpg'
  UNION ALL SELECT 'SHP019','girl-fashion-01.jpg','girl-fashion-04.jpg'
  UNION ALL SELECT 'SHP020','girl-fashion-03.jpg','girl-fashion-05.jpg'
  UNION ALL SELECT 'SHP021','girl-fashion-02.jpg','girl-fashion-06.jpg'
  UNION ALL SELECT 'SHP022','girl-fashion-01.jpg','girl-fashion-05.jpg'
  UNION ALL SELECT 'SHP023','girl-fashion-04.jpg','girl-fashion-02.jpg'
  UNION ALL SELECT 'SHP024','girl-fashion-06.jpg','girl-fashion-01.jpg'
  UNION ALL SELECT 'SHP025','girl-fashion-02.jpg','girl-fashion-04.jpg'
  UNION ALL SELECT 'SHP026','girl-fashion-05.jpg','girl-fashion-03.jpg'
  UNION ALL SELECT 'SHP027','girl-fashion-03.jpg','girl-fashion-02.jpg'
  UNION ALL SELECT 'SHP028','girl-fashion-06.jpg','girl-fashion-04.jpg'
  UNION ALL SELECT 'SHP029','girl-fashion-05.jpg','girl-fashion-01.jpg'
) images ON images.code = p.code
SET pi.image_url = CONCAT('/images/products/', CASE WHEN pi.is_primary = TRUE THEN images.image ELSE images.second_image END);

COMMIT;
