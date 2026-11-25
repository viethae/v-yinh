import assert from 'node:assert/strict';
import test from 'node:test';
import { pool } from '../src/config/db.js';
import { setWorkerEnvironment } from '../src/config/runtime.js';
import {
  deleteProductImage,
  getManagedImageFilename,
  readProductImage,
  saveProductImage
} from '../src/utils/product-image-storage.js';

function createDatabase() {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...params) {
          return {
            sql,
            params,
            async all() {
              calls.push({ type: 'all', sql, params });
              return { results: [] };
            },
            async run() {
              calls.push({ type: 'run', sql, params });
              return { meta: { last_row_id: 17, changes: 1 } };
            }
          };
        }
      };
    },
    async batch(statements) {
      calls.push({ type: 'batch', statements });
    }
  };
}

test('D1 expands array parameters and normalizes MySQL date syntax', async () => {
  const database = createDatabase();
  setWorkerEnvironment({ DB: database });

  await pool.query(
    `SELECT id FROM product_variants WHERE id IN (?) AND created_at >= NOW() FOR UPDATE`,
    [[3, 5]]
  );

  assert.deepEqual(database.calls[0], {
    type: 'all',
    sql: 'SELECT id FROM product_variants WHERE id IN (?,?) AND created_at >= CURRENT_TIMESTAMP',
    params: [3, 5]
  });
});

test('D1 batches preserve insert placeholders and generated IDs across related rows', async () => {
  const database = createDatabase();
  setWorkerEnvironment({ DB: database });
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  const [order] = await connection.execute(
    'INSERT INTO orders(order_code,user_id) VALUES(?,?)',
    ['AX123', null]
  );
  await connection.execute(
    'INSERT INTO order_items(order_id,variant_id) VALUES(?,?)',
    [order.insertId, 42]
  );
  await connection.commit();

  const { statements } = database.calls[0];
  assert.equal(statements[0].sql, 'INSERT INTO orders(id,order_code,user_id) VALUES(?,?,?)');
  assert.equal(statements[0].params[0], order.insertId);
  assert.deepEqual(statements[0].params.slice(1), ['AX123', null]);
  assert.equal(statements[1].sql, 'INSERT INTO order_items(id,order_id,variant_id) VALUES(?,?,?)');
  assert.equal(statements[1].params[1], order.insertId);
  assert.equal(statements[1].params[2], 42);
  assert.ok(Number.isInteger(statements[1].params[0]));
});

test('D1 stores, reads, and removes managed product image blobs', async () => {
  const images = new Map();
  const database = {
    prepare(sql) {
      return {
        bind(...params) {
          if (sql.startsWith('INSERT')) {
            return { async run() { images.set(params[0], { content_type: params[1], image_data: params[2] }); } };
          }
          if (sql.startsWith('SELECT')) {
            return { async first() {
              const image = images.get(params[0]);
              return image ? { ...image, image_data: Array.from(image.image_data) } : null;
            } };
          }
          return { async run() { images.delete(params[0]); } };
        }
      };
    }
  };
  setWorkerEnvironment({ DB: database });
  const filename = '4baf03a3-4f20-4ab3-9bc5-bad0e86f7904.webp';
  const image = new Uint8Array([1, 2, 3]);

  assert.equal(getManagedImageFilename(`/uploads/products/${filename}`), filename);
  assert.equal(getManagedImageFilename('/uploads/products/../../secret.txt'), null);
  await saveProductImage(filename, image, 'image/webp');
  assert.deepEqual(await readProductImage(filename), { body: image, contentType: 'image/webp' });
  await deleteProductImage(filename);
  assert.equal(await readProductImage(filename), null);
});
