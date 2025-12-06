/**
 * Enhanced Product Scraper
 * Extracts product information from e-commerce URLs
 * Supports: Schema.org, OpenGraph, and common HTML patterns
 */

import * as cheerio from 'cheerio';
import axios from 'axios';

export interface ProductData {
  name: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  images?: string[];
  category?: string;
  brand?: string;
  sku?: string;
  inStock?: boolean;
  stockStatus?: string;
  features?: string;
  variants?: any;
  sourceUrl: string;
}

export class ProductScraper {
  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000,
        maxRedirects: 5,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch product page: ${error.message}`);
    }
  }

  async scrapeProduct(url: string): Promise<ProductData> {
    const html = await this.fetchPage(url);
    const $ = cheerio.load(html);

    let productData: ProductData = {
      name: '',
      sourceUrl: url,
    };

    // Try multiple extraction methods (in order of reliability)
    productData = this.extractSchemaOrg($, productData);
    productData = this.extractOpenGraph($, productData);
    productData = this.extractMicrodata($, productData);
    productData = this.extractCommonPatterns($, productData);

    // Clean up the data
    productData = this.cleanProductData(productData);

    if (!productData.name) {
      throw new Error('Could not extract product information from the URL. Make sure this is a valid product page.');
    }

    return productData;
  }

  /**
   * Extract product data from Schema.org JSON-LD
   * This is the most reliable method used by modern e-commerce sites
   */
  private extractSchemaOrg($: cheerio.CheerioAPI, data: ProductData): ProductData {
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const jsonText = $(el).html();
        if (!jsonText) return;

        const json = JSON.parse(jsonText);
        const products = Array.isArray(json) ? json : [json];

        for (const item of products) {
          if (item['@type'] === 'Product' || item['@type']?.includes?.('Product')) {
            // Name
            if (item.name && !data.name) {
              data.name = item.name;
            }

            // Description
            if (item.description && !data.description) {
              data.description = item.description;
            }

            // Price
            if (item.offers) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              if (offer.price && !data.price) {
                data.price = parseFloat(offer.price);
              }
              if (offer.priceCurrency && !data.currency) {
                data.currency = offer.priceCurrency;
              }
              // Stock status
              if (offer.availability) {
                const availability = offer.availability.toLowerCase();
                data.inStock = availability.includes('instock');
                data.stockStatus = availability.includes('instock') ? 'in_stock' :
                                  availability.includes('outofstock') ? 'out_of_stock' :
                                  availability.includes('preorder') ? 'preorder' : 'unknown';
              }
            }

            // Images
            if (item.image) {
              const images = Array.isArray(item.image) ? item.image : [item.image];
              data.images = images.map((img: any) => typeof img === 'string' ? img : img.url || img['@id']).filter(Boolean);
            }

            // Brand
            if (item.brand && !data.brand) {
              data.brand = typeof item.brand === 'string' ? item.brand : item.brand.name;
            }

            // SKU
            if (item.sku && !data.sku) {
              data.sku = item.sku;
            }

            // Category
            if (item.category && !data.category) {
              data.category = item.category;
            }
          }
        }
      } catch (error) {
        // Skip invalid JSON
      }
    });

    return data;
  }

  /**
   * Extract product data from OpenGraph meta tags
   * Used by many e-commerce platforms
   */
  private extractOpenGraph($: cheerio.CheerioAPI, data: ProductData): ProductData {
    // Check if it's a product page
    const ogType = $('meta[property="og:type"]').attr('content');
    if (!ogType?.toLowerCase().includes('product')) {
      return data;
    }

    // Name/Title
    if (!data.name) {
      data.name = $('meta[property="og:title"]').attr('content') ||
                  $('meta[property="product:title"]').attr('content') || '';
    }

    // Description
    if (!data.description) {
      data.description = $('meta[property="og:description"]').attr('content') ||
                        $('meta[property="product:description"]').attr('content');
    }

    // Price
    if (!data.price) {
      const priceStr = $('meta[property="product:price:amount"]').attr('content') ||
                      $('meta[property="og:price:amount"]').attr('content');
      if (priceStr) {
        data.price = parseFloat(priceStr);
      }
    }

    // Currency
    if (!data.currency) {
      data.currency = $('meta[property="product:price:currency"]').attr('content') ||
                     $('meta[property="og:price:currency"]').attr('content');
    }

    // Images
    if (!data.images || data.images.length === 0) {
      const ogImages: string[] = [];
      $('meta[property="og:image"], meta[property="product:image"]').each((i, el) => {
        const img = $(el).attr('content');
        if (img) ogImages.push(img);
      });
      if (ogImages.length > 0) {
        data.images = ogImages;
      }
    }

    // Brand
    if (!data.brand) {
      data.brand = $('meta[property="product:brand"]').attr('content') ||
                  $('meta[property="og:brand"]').attr('content');
    }

    // Availability
    if (data.inStock === undefined) {
      const availability = $('meta[property="product:availability"]').attr('content');
      if (availability) {
        data.inStock = availability.toLowerCase().includes('instock');
        data.stockStatus = availability.toLowerCase();
      }
    }

    return data;
  }

  /**
   * Extract from Microdata (older format)
   */
  private extractMicrodata($: cheerio.CheerioAPI, data: ProductData): ProductData {
    const productEl = $('[itemtype*="schema.org/Product"]');
    if (productEl.length === 0) return data;

    if (!data.name) {
      data.name = productEl.find('[itemprop="name"]').text().trim() ||
                  productEl.find('[itemprop="name"]').attr('content') || '';
    }

    if (!data.description) {
      data.description = productEl.find('[itemprop="description"]').text().trim() ||
                        productEl.find('[itemprop="description"]').attr('content');
    }

    if (!data.price) {
      const priceStr = productEl.find('[itemprop="price"]').attr('content') ||
                      productEl.find('[itemprop="price"]').text().trim();
      if (priceStr) {
        data.price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
      }
    }

    if (!data.currency) {
      data.currency = productEl.find('[itemprop="priceCurrency"]').attr('content');
    }

    if (!data.brand) {
      data.brand = productEl.find('[itemprop="brand"]').text().trim() ||
                  productEl.find('[itemprop="brand"] [itemprop="name"]').text().trim();
    }

    return data;
  }

  /**
   * Extract using common HTML patterns and CSS selectors
   * Fallback method when structured data is not available
   */
  private extractCommonPatterns($: cheerio.CheerioAPI, data: ProductData): ProductData {
    // Name - try multiple common selectors
    if (!data.name) {
      const nameSelectors = [
        'h1.product-title',
        'h1.product-name',
        'h1[class*="product"]',
        '.product-title h1',
        '[data-product-title]',
        'h1',
      ];

      for (const selector of nameSelectors) {
        const name = $(selector).first().text().trim();
        if (name && name.length > 0 && name.length < 200) {
          data.name = name;
          break;
        }
      }
    }

    // Price - common patterns
    if (!data.price) {
      const priceSelectors = [
        '.price',
        '.product-price',
        '[class*="price"]',
        '[data-price]',
        'span[class*="price"]',
      ];

      for (const selector of priceSelectors) {
        const priceText = $(selector).first().text().trim();
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          const priceStr = priceMatch[0].replace(/,/g, '');
          const price = parseFloat(priceStr);
          if (price > 0 && price < 1000000) {
            data.price = price;
            break;
          }
        }
      }
    }

    // Images
    if (!data.images || data.images.length === 0) {
      const images: string[] = [];

      // Try product image galleries
      $('[class*="product-image"] img, [class*="gallery"] img, [data-zoom-image]').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-zoom-image');
        if (src && !src.includes('placeholder') && !src.includes('icon')) {
          images.push(src);
        }
      });

      if (images.length > 0) {
        data.images = [...new Set(images)].slice(0, 10); // Unique images, max 10
      }
    }

    // Description
    if (!data.description) {
      const descSelectors = [
        '.product-description',
        '[class*="description"]',
        '.product-details',
        'meta[name="description"]',
      ];

      for (const selector of descSelectors) {
        const desc = $(selector).first().text().trim() ||
                    $(selector).first().attr('content');
        if (desc && desc.length > 20 && desc.length < 5000) {
          data.description = desc;
          break;
        }
      }
    }

    // Stock status
    if (data.inStock === undefined) {
      const stockText = $('[class*="stock"], [class*="availability"]').text().toLowerCase();
      data.inStock = !stockText.includes('out of stock') && !stockText.includes('unavailable');
      data.stockStatus = stockText.includes('in stock') || stockText.includes('available') ? 'in_stock' : 'unknown';
    }

    return data;
  }

  /**
   * Clean and validate product data
   */
  private cleanProductData(data: ProductData): ProductData {
    // Trim strings
    if (data.name) data.name = data.name.trim().substring(0, 500);
    if (data.description) data.description = data.description.trim().substring(0, 5000);
    if (data.brand) data.brand = data.brand.trim().substring(0, 191);
    if (data.category) data.category = data.category.trim().substring(0, 191);
    if (data.sku) data.sku = data.sku.trim().substring(0, 191);

    // Validate price
    if (data.price && (data.price < 0 || data.price > 10000000)) {
      data.price = undefined;
    }

    // Default currency
    if (!data.currency && data.price) {
      data.currency = 'USD';
    }

    // Clean image URLs (convert relative to absolute)
    if (data.images) {
      try {
        const baseUrl = new URL(data.sourceUrl);
        data.images = data.images.map(img => {
          if (img.startsWith('http')) return img;
          if (img.startsWith('//')) return `https:${img}`;
          if (img.startsWith('/')) return `${baseUrl.origin}${img}`;
          return `${baseUrl.origin}/${img}`;
        });
      } catch (error) {
        // Keep original images if URL parsing fails
      }
    }

    // Default stock status
    if (data.inStock === undefined) {
      data.inStock = true;
      data.stockStatus = 'in_stock';
    }

    return data;
  }

  /**
   * Generate product summary for knowledge base
   */
  generateProductSummary(product: ProductData): string {
    let summary = `Product: ${product.name}\n\n`;

    if (product.brand) {
      summary += `Brand: ${product.brand}\n`;
    }

    if (product.category) {
      summary += `Category: ${product.category}\n`;
    }

    if (product.price) {
      const priceStr = product.originalPrice && product.originalPrice > product.price
        ? `${product.currency} ${product.price} (was ${product.currency} ${product.originalPrice})`
        : `${product.currency} ${product.price}`;
      summary += `Price: ${priceStr}\n`;
    }

    if (product.sku) {
      summary += `SKU: ${product.sku}\n`;
    }

    summary += `Availability: ${product.inStock ? 'In Stock' : 'Out of Stock'}\n`;

    if (product.description) {
      summary += `\nDescription:\n${product.description}\n`;
    }

    if (product.features) {
      summary += `\nFeatures:\n${product.features}\n`;
    }

    if (product.variants) {
      summary += `\nAvailable Variants: ${JSON.stringify(product.variants)}\n`;
    }

    summary += `\nProduct URL: ${product.sourceUrl}\n`;

    return summary;
  }
}

export const productScraper = new ProductScraper();
