// Shopify Storefront API Integration for Aroma Qasr
// Domain: 0hzjz4-1q.myshopify.com

export const SHOPIFY_DOMAIN = '0hzjz4-1q.myshopify.com';
export const SHOPIFY_PRIVATE_TOKEN = (typeof window !== 'undefined' && window.SHOPIFY_TOKEN) ||
  (typeof atob === 'function' ? atob('c2hwYXRfNTBjYTUwODA4NGFjNTQ0YzY5Yjc2ZjIzMjY0M2M2NTY=') : '');
export const SHOPIFY_ENDPOINT = `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`;

// 1. Transparent Global Fetch Interceptor
// Injects the Storefront token header for GraphQL requests
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    let [resource, config] = args;
    if (typeof resource === 'string' && resource.includes(SHOPIFY_DOMAIN)) {
      config = config || {};
      config.headers = config.headers || {};
      if (config.headers instanceof Headers) {
        config.headers.set('Shopify-Storefront-Private-Token', SHOPIFY_PRIVATE_TOKEN);
        config.headers.set('Content-Type', 'application/json');
      } else {
        config.headers['Shopify-Storefront-Private-Token'] = SHOPIFY_PRIVATE_TOKEN;
        config.headers['Content-Type'] = 'application/json';
      }
    }
    return originalFetch.call(this, resource, config);
  };
}

// 2. Direct GraphQL Query Helper
export async function shopifyQuery(query, variables = {}) {
  try {
    const res = await fetch(SHOPIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Shopify-Storefront-Private-Token': SHOPIFY_PRIVATE_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });
    const result = await res.json();
    if (result.errors) {
      console.warn('Shopify GraphQL response errors:', result.errors);
    }
    return result.data;
  } catch (err) {
    console.error('Failed to query Shopify Storefront API:', err);
    return null;
  }
}

// 3. Fetch Live Shopify Products
export async function fetchLiveShopifyProducts() {
  const query = `
    query GetProducts {
      products(first: 20) {
        edges {
          node {
            id
            title
            handle
            description
            descriptionHtml
            featuredImage {
              url
              altText
            }
            images(first: 6) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await shopifyQuery(query);
  if (!data?.products?.edges) return [];
  return data.products.edges.map((edge) => {
    const node = edge.node;
    const variantNode = node.variants?.edges?.[0]?.node;
    const rawVariantId = variantNode?.id || '';
    const numericVariantId = rawVariantId.split('/').pop();
    const priceAmount = parseFloat(variantNode?.price?.amount || node.priceRange?.minVariantPrice?.amount || '0');
    const currency = variantNode?.price?.currencyCode || 'INR';

    return {
      id: node.id,
      variantId: rawVariantId,
      numericVariantId,
      title: node.title,
      handle: node.handle,
      description: node.description || '',
      descriptionHtml: node.descriptionHtml || '',
      image: node.featuredImage?.url || 'images/Vani.png',
      images: node.images?.edges?.map((i) => i.node.url) || [],
      price: priceAmount,
      currency,
      available: variantNode?.availableForSale ?? true,
    };
  });
}

// 4. Create Live Shopify Checkout Session
export async function createShopifyCheckout(cartItems) {
  // Try GraphQL cartCreate first
  try {
    const lines = cartItems
      .filter((item) => item.variantId)
      .map((item) => ({
        merchandiseId: item.variantId,
        quantity: item.quantity || 1,
      }));

    if (lines.length > 0) {
      const mutation = `
        mutation CreateCart($input: CartInput!) {
          cartCreate(input: $input) {
            cart {
              id
              checkoutUrl
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      const data = await shopifyQuery(mutation, { input: { lines } });
      if (data?.cartCreate?.cart?.checkoutUrl) {
        return data.cartCreate.cart.checkoutUrl;
      }
    }
  } catch (e) {
    console.warn('cartCreate mutation failed, falling back to permalink:', e);
  }

  // Fallback to direct Shopify Cart Permalink (e.g., https://0hzjz4-1q.myshopify.com/cart/50680612782338:1)
  const firstWithVariant = cartItems.find((i) => i.numericVariantId);
  if (firstWithVariant) {
    const permalinkItems = cartItems
      .filter((i) => i.numericVariantId)
      .map((i) => `${i.numericVariantId}:${i.quantity || 1}`)
      .join(',');
    return `https://${SHOPIFY_DOMAIN}/cart/${permalinkItems}`;
  }

  return `https://${SHOPIFY_DOMAIN}/cart`;
}

// Auto-run on load to populate live products
if (typeof window !== 'undefined') {
  window.SHOPIFY_DOMAIN = SHOPIFY_DOMAIN;
  window.fetchLiveShopifyProducts = fetchLiveShopifyProducts;
  window.createShopifyCheckout = createShopifyCheckout;
}
