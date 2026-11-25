USE ao_xinh;

START TRANSACTION;

INSERT INTO products (
  category_id, name, slug, code, description, material,
  base_price, sale_price, is_new, is_featured, sold_count
)
SELECT
  c.id, seed.name, seed.slug, seed.code, seed.description, NULL,
  seed.base_price, seed.sale_price, TRUE, FALSE, 0
FROM categories c
JOIN (
  SELECT 'Áo Thun Nam Sun Seeker Form Regular' AS name, 'ao-thun-nam-sun-seeker-form-regular' AS slug, 'ICD001' AS code, 'Áo thun nam phom regular, phù hợp phối đồ thường ngày.' AS description, 329000 AS base_price, 149000 AS sale_price
  UNION ALL SELECT 'Áo Khoác Jeans Nam Skyfold Form Regular', 'ao-khoac-jeans-nam-skyfold-form-regular', 'ICD002', 'Áo khoác jeans nam phom regular, tiện phối lớp.', 699000, 499000
  UNION ALL SELECT 'Áo Polo Nam Mickey Checked Form Regular', 'ao-polo-nam-mickey-checked-form-regular', 'ICD003', 'Áo polo nam họa tiết caro, phom regular.', 479000, 399000
  UNION ALL SELECT 'Quần Smart Jeans Nam Siêu Co Dãn Deep Rinse Indigo Form Smart Fit', 'quan-smart-jeans-nam-deep-rinse-indigo-form-smart-fit', 'ICD004', 'Quần jeans nam phom Smart Fit, sắc chàm Deep Rinse Indigo.', 599000, 449000
  UNION ALL SELECT 'Quần Jogger Cargo Nam Military Form Straight', 'quan-jogger-cargo-nam-military-form-straight', 'ICD005', 'Quần jogger cargo nam phom Straight.', 579000, 449000
  UNION ALL SELECT 'Quần Tây Nam Airflex Siêu Gọn Nhẹ Performance Form Slim', 'quan-tay-nam-airflex-performance-form-slim', 'ICD006', 'Quần tây nam phom Slim, thiết kế Airflex.', 499000, 399000
  UNION ALL SELECT 'Áo Polo Nam Elite Mark Form Regular', 'ao-polo-nam-elite-mark-form-regular', 'ICD007', 'Áo polo nam Elite Mark phom regular.', 429000, 349000
  UNION ALL SELECT 'Áo Polo Nam ProCOOL New Gen Seam Sealing Form Slim Fit', 'ao-polo-nam-procool-new-gen-seam-sealing-form-slim-fit', 'ICD008', 'Áo polo nam ProCOOL phom Slim Fit, thiết kế Seam Sealing.', 399000, 299000
  UNION ALL SELECT 'Áo Polo Nam Refined Form Boxy', 'ao-polo-nam-refined-form-boxy', 'ICD009', 'Áo polo nam phom Boxy.', 399000, 329000
  UNION ALL SELECT 'Áo Polo Nam Mono Form Regular', 'ao-polo-nam-mono-form-regular', 'ICD010', 'Áo polo nam phom regular.', 429000, 349000
  UNION ALL SELECT 'Áo Sơ Mi Nam Tay Ngắn Blanko Form Slim', 'ao-so-mi-nam-tay-ngan-blanko-form-slim', 'ICD011', 'Áo sơ mi nam tay ngắn Blanko phom Slim.', 429000, 349000
  UNION ALL SELECT 'Quần Jean Nam Siêu Nhẹ Dark Grey ICON105 Form Loose', 'quan-jean-nam-dark-grey-icon105-form-loose', 'ICD012', 'Quần jeans nam Dark Grey ICON105 phom Loose.', 429000, 299000
  UNION ALL SELECT 'Set Đồ Ngắn Nam Edgestitch', 'set-do-ngan-nam-edgestitch', 'ICD013', 'Set đồ ngắn nam Edgestitch.', 379000, 299000
  UNION ALL SELECT 'Quần Short Jeans Nam Gridline Form Loose', 'quan-short-jeans-nam-gridline-form-loose', 'ICD014', 'Quần short jeans nam Gridline phom Loose.', 399000, 299000
  UNION ALL SELECT 'Áo Polo Nam Imperial Form Regular', 'ao-polo-nam-imperial-form-regular', 'ICD015', 'Áo polo nam Imperial phom regular.', 399000, 329000
  UNION ALL SELECT 'Quần Short Nam Speckled Form Loose', 'quan-short-nam-speckled-form-loose', 'ICD016', 'Quần short nam Speckled phom Loose.', 329000, 249000
  UNION ALL SELECT 'Quần Short Nam Seraphin Form Regular', 'quan-short-nam-seraphin-form-regular', 'ICD017', 'Quần short nam Seraphin phom regular.', 349000, 299000
  UNION ALL SELECT 'Quần Short Nam Striped Form Regular', 'quan-short-nam-striped-form-regular', 'ICD018', 'Quần short nam Striped phom regular.', 379000, 299000
) seed ON c.slug = 'nam'
WHERE NOT EXISTS (
  SELECT 1 FROM products existing WHERE existing.code = seed.code
);

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT p.id,
  CONCAT('https://images.pexels.com/photos/', seed.photo_id, '/pexels-photo-', seed.photo_id, '.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'),
  1, TRUE
FROM products p
JOIN (
  SELECT 'ICD001' AS code, '994523' AS photo_id
  UNION ALL SELECT 'ICD002', '1689731'
  UNION ALL SELECT 'ICD003', '977908'
  UNION ALL SELECT 'ICD004', '769122'
  UNION ALL SELECT 'ICD005', '1468379'
  UNION ALL SELECT 'ICD006', '1755428'
  UNION ALL SELECT 'ICD007', '1036622'
  UNION ALL SELECT 'ICD008', '1040945'
  UNION ALL SELECT 'ICD009', '1536619'
  UNION ALL SELECT 'ICD010', '1043474'
  UNION ALL SELECT 'ICD011', '985635'
  UNION ALL SELECT 'ICD012', '1181686'
  UNION ALL SELECT 'ICD013', '1183266'
  UNION ALL SELECT 'ICD014', '3755706'
  UNION ALL SELECT 'ICD015', '5325880'
  UNION ALL SELECT 'ICD016', '7679720'
  UNION ALL SELECT 'ICD017', '5709665'
  UNION ALL SELECT 'ICD018', '6311387'
) seed ON seed.code = p.code
WHERE NOT EXISTS (
  SELECT 1 FROM product_images existing
  WHERE existing.product_id = p.id AND existing.is_primary = TRUE
);

-- Color, size, and stock values are demo placeholders, not inventory from the source shop.
INSERT INTO product_variants (product_id, color_name, color_hex, size, stock)
SELECT p.id, colors.color_name, colors.color_hex, sizes.size, 8
FROM products p
JOIN (
  SELECT 'ICD001' AS code UNION ALL SELECT 'ICD002' UNION ALL SELECT 'ICD003'
  UNION ALL SELECT 'ICD004' UNION ALL SELECT 'ICD005' UNION ALL SELECT 'ICD006'
  UNION ALL SELECT 'ICD007' UNION ALL SELECT 'ICD008' UNION ALL SELECT 'ICD009'
  UNION ALL SELECT 'ICD010' UNION ALL SELECT 'ICD011' UNION ALL SELECT 'ICD012'
  UNION ALL SELECT 'ICD013' UNION ALL SELECT 'ICD014' UNION ALL SELECT 'ICD015'
  UNION ALL SELECT 'ICD016' UNION ALL SELECT 'ICD017' UNION ALL SELECT 'ICD018'
) added ON added.code = p.code
CROSS JOIN (
  SELECT 'Đen' AS color_name, '#171717' AS color_hex
  UNION ALL SELECT 'Trắng', '#ffffff'
  UNION ALL SELECT 'Xanh navy', '#1d3557'
) colors
CROSS JOIN (
  SELECT 'S' AS size UNION ALL SELECT 'M' UNION ALL SELECT 'L'
  UNION ALL SELECT 'XL' UNION ALL SELECT 'XXL'
) sizes
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants existing
  WHERE existing.product_id = p.id
    AND existing.color_name = colors.color_name
    AND existing.size = sizes.size
);

COMMIT;
