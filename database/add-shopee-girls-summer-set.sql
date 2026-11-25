USE ao_xinh;

START TRANSACTION;

INSERT INTO products (
  category_id, name, slug, code, description, material,
  base_price, sale_price, is_new, is_featured, sold_count
)
SELECT category.id,
       'Bộ hai chiếc bé gái mùa hè thắt eo áo sơ mi ngắn tay',
       'bo-hai-chiec-be-gai-mua-he-that-eo-so-mi-ngan-tay',
       'SHP021',
       'Bộ hai món cho bé gái mùa hè gồm áo sơ mi ngắn tay và phần váy/quần đi kèm, kiểu thắt eo nhẹ nhàng và dễ thương.',
       'Cotton pha',
       349000,
       299000,
       TRUE,
       TRUE,
       0
FROM categories category
WHERE category.slug = 'be-gai'
  AND NOT EXISTS (SELECT 1 FROM products WHERE code = 'SHP021');

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT p.id, '/images/products/girl-fashion-02.jpg', 1, TRUE
FROM products p
WHERE p.code = 'SHP021'
  AND NOT EXISTS (
    SELECT 1 FROM product_images existing
    WHERE existing.product_id = p.id AND existing.is_primary = TRUE
  );

INSERT INTO product_variants (product_id, color_name, color_hex, size, stock)
SELECT p.id, 'Hồng', '#d99aa5', sizes.size, 8
FROM products p
JOIN (
  SELECT 'S' size
  UNION ALL SELECT 'M'
  UNION ALL SELECT 'L'
) sizes
WHERE p.code = 'SHP021'
  AND NOT EXISTS (
    SELECT 1 FROM product_variants existing
    WHERE existing.product_id = p.id
  );

COMMIT;
