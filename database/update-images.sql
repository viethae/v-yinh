USE ao_xinh;

DELETE FROM product_images;

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
SELECT p.id,CONCAT('https://images.pexels.com/photos/',s.photo_id,'/pexels-photo-',s.photo_id,'.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'),1,TRUE
FROM products p JOIN image_sources s ON s.position_no=p.id;

INSERT INTO product_images(product_id,image_url,sort_order,is_primary)
SELECT p.id,CONCAT('https://images.pexels.com/photos/',s.photo_id,'/pexels-photo-',s.photo_id,'.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'),2,FALSE
FROM products p JOIN image_sources s ON s.position_no=MOD(p.id,30)+1;

INSERT INTO product_images(product_id,image_url,sort_order,is_primary)
SELECT p.id,CONCAT('https://images.pexels.com/photos/',s.photo_id,'/pexels-photo-',s.photo_id,'.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'),3,FALSE
FROM products p JOIN image_sources s ON s.position_no=MOD(p.id+9,30)+1;

UPDATE banners SET image_url='https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg?auto=compress&cs=tinysrgb&w=1800&h=800&fit=crop' WHERE sort_order=1;
UPDATE banners SET image_url='https://images.pexels.com/photos/977908/pexels-photo-977908.jpeg?auto=compress&cs=tinysrgb&w=1800&h=800&fit=crop' WHERE sort_order=2;
UPDATE banners SET image_url='https://images.pexels.com/photos/769122/pexels-photo-769122.jpeg?auto=compress&cs=tinysrgb&w=1800&h=800&fit=crop' WHERE sort_order=3;

DROP TEMPORARY TABLE image_sources;
