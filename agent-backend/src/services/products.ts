export interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  shopee_url: string;
  keywords: string;
  is_active: number;
  created_at?: string;
}

export async function getProducts(db: D1Database): Promise<Product[]> {
  const { results } = await db.prepare(
    'SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC'
  ).all()
  return (results ?? []) as unknown as Product[]
}

export async function getAllProducts(db: D1Database): Promise<Product[]> {
  const { results } = await db.prepare(
    'SELECT * FROM products ORDER BY created_at DESC'
  ).all()
  return (results ?? []) as unknown as Product[]
}

export async function addProduct(
  db: D1Database,
  product: Omit<Product, 'id' | 'created_at'>
): Promise<void> {
  await db.prepare(
    'INSERT INTO products (name, price, image_url, shopee_url, keywords, is_active) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(
    product.name,
    product.price,
    product.image_url,
    product.shopee_url,
    product.keywords,
    product.is_active ?? 1
  ).run()
}

export async function addProductsBulk(
  db: D1Database,
  products: Omit<Product, 'id' | 'created_at'>[]
): Promise<void> {
  if (products.length === 0) return

  const stmt = db.prepare(
    'INSERT INTO products (name, price, image_url, shopee_url, keywords, is_active) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const statements = products.map(product => 
    stmt.bind(
      product.name,
      product.price,
      product.image_url,
      product.shopee_url,
      product.keywords,
      product.is_active ?? 1
    )
  )

  await db.batch(statements)
}

export async function updateProduct(
  db: D1Database,
  id: number,
  product: Partial<Omit<Product, 'id' | 'created_at'>>
): Promise<void> {
  const fields: string[] = []
  const values: any[] = []

  if (product.name !== undefined) { fields.push('name = ?'); values.push(product.name) }
  if (product.price !== undefined) { fields.push('price = ?'); values.push(product.price) }
  if (product.image_url !== undefined) { fields.push('image_url = ?'); values.push(product.image_url) }
  if (product.shopee_url !== undefined) { fields.push('shopee_url = ?'); values.push(product.shopee_url) }
  if (product.keywords !== undefined) { fields.push('keywords = ?'); values.push(product.keywords) }
  if (product.is_active !== undefined) { fields.push('is_active = ?'); values.push(product.is_active) }

  if (fields.length === 0) return

  values.push(id)
  await db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
}

export async function deleteProduct(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
}

/**
 * Match products based on keywords found in the AI response text.
 * Returns products whose keywords appear in the AI response (case-insensitive).
 */
export async function matchProducts(db: D1Database, aiResponse: string): Promise<Product[]> {
  const activeProducts = await getProducts(db)
  const responseLower = aiResponse.toLowerCase()

  const matched = activeProducts.filter(product => {
    const keywords = product.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0)
    return keywords.some(keyword => responseLower.includes(keyword))
  })

  // Return max 6 products to avoid cluttering
  return matched.slice(0, 6)
}
