import { getRuntimeBinding } from '../config/runtime.js';

const managedImagePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i;
export const maxProductImageBytes = 1.5 * 1024 * 1024;

function getLocalImageDirectoryUrl() {
  return new URL('../../uploads/products/', import.meta.url);
}

export function getManagedImageFilename(imageUrl) {
  if (!imageUrl) return null;
  try {
    const filename = new URL(imageUrl, 'http://localhost').pathname.split('/').pop();
    return filename && managedImagePattern.test(filename) ? filename : null;
  } catch {
    return null;
  }
}

export async function saveProductImage(filename, image, contentType) {
  const database = getRuntimeBinding('DB');
  if (database) {
    await database.prepare(
      'INSERT INTO product_image_blobs(filename,content_type,image_data) VALUES(?,?,?)'
    ).bind(filename, contentType, image).run();
    return;
  }
  const [{ mkdir, writeFile }, { fileURLToPath }, { join }] = await Promise.all([
    import('node:fs/promises'),
    import('node:url'),
    import('node:path')
  ]);
  const directory = fileURLToPath(getLocalImageDirectoryUrl());
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, filename), image, { flag: 'wx' });
}

export async function readProductImage(filename) {
  if (!managedImagePattern.test(filename)) return null;
  const database = getRuntimeBinding('DB');
  if (database) {
    const image = await database.prepare(
      'SELECT content_type,image_data FROM product_image_blobs WHERE filename=?'
    ).bind(filename).first();
    if (!image) return null;
    let body;
    if (image.image_data instanceof ArrayBuffer) body = new Uint8Array(image.image_data);
    else if (ArrayBuffer.isView(image.image_data)) {
      body = new Uint8Array(image.image_data.buffer, image.image_data.byteOffset, image.image_data.byteLength);
    } else if (Array.isArray(image.image_data)) body = Uint8Array.from(image.image_data);
    else throw new TypeError('D1 returned invalid product image data');
    return {
      body,
      contentType: image.content_type
    };
  }
  try {
    const [{ readFile }, { fileURLToPath }, { join }] = await Promise.all([
      import('node:fs/promises'),
      import('node:url'),
      import('node:path')
    ]);
    return {
      body: await readFile(join(fileURLToPath(getLocalImageDirectoryUrl()), filename)),
      contentType: filename.endsWith('.png') ? 'image/png' : filename.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
    };
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function deleteProductImage(filename) {
  if (!managedImagePattern.test(filename)) return;
  const database = getRuntimeBinding('DB');
  if (database) {
    await database.prepare('DELETE FROM product_image_blobs WHERE filename=?').bind(filename).run();
    return;
  }
  const [{ unlink }, { fileURLToPath }, { join }] = await Promise.all([
    import('node:fs/promises'),
    import('node:url'),
    import('node:path')
  ]);
  try {
    await unlink(join(fileURLToPath(getLocalImageDirectoryUrl()), filename));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
