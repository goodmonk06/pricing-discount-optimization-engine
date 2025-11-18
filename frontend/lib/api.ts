const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchProducts() {
  const res = await fetch(`${API_URL}/products`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchProduct(id: string) {
  const res = await fetch(`${API_URL}/products/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function createProduct(data: any) {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create product');
  }
  return res.json();
}

export async function updateProduct(id: string, data: any) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function deleteProduct(id: string) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function fetchPriceRules(productId?: string) {
  const url = productId
    ? `${API_URL}/price-rules?productId=${productId}`
    : `${API_URL}/price-rules`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch price rules');
  return res.json();
}

export async function createPriceRule(data: any) {
  const res = await fetch(`${API_URL}/price-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create price rule');
  }
  return res.json();
}

export async function updatePriceRule(id: string, data: any) {
  const res = await fetch(`${API_URL}/price-rules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update price rule');
  return res.json();
}

export async function deletePriceRule(id: string) {
  const res = await fetch(`${API_URL}/price-rules/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete price rule');
}

export async function fetchLogs(productId?: string) {
  const url = productId
    ? `${API_URL}/logs?productId=${productId}`
    : `${API_URL}/logs`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function fetchOptimizationSuggestions() {
  const res = await fetch(`${API_URL}/optimization-suggestions`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch optimization suggestions');
  return res.json();
}
