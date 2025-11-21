import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class DocumentProcessor {
  /**
   * Extract text from PDF buffer
   */
  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from Word document buffer (.docx)
   */
  async extractTextFromWord(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting Word text:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  /**
   * Scrape text content from website URL (with multi-page crawling)
   * @param url - Starting URL to scrape
   * @param maxPages - Maximum number of pages to crawl (default: 10)
   */
  async scrapeWebsite(url: string, maxPages: number = 10): Promise<{
    title: string;
    content: string;
    description?: string;
  }> {
    try {
      // Validate URL
      const baseUrl = new URL(url);
      const visitedUrls = new Set<string>();
      const toVisit: string[] = [url];
      let allContent = '';
      let mainTitle = '';
      let mainDescription = '';

      console.log(`🕷️ Starting website crawl from: ${url} (max ${maxPages} pages)`);

      while (toVisit.length > 0 && visitedUrls.size < maxPages) {
        const currentUrl = toVisit.shift()!;

        // Skip if already visited
        if (visitedUrls.has(currentUrl)) continue;

        try {
          console.log(`📄 Crawling page ${visitedUrls.size + 1}/${maxPages}: ${currentUrl}`);

          const response = await axios.get(currentUrl, {
            timeout: 15000,
            headers: {
              'User-Agent': 'WhaSales-AI-Bot/1.0',
            },
            maxRedirects: 5,
          });

          visitedUrls.add(currentUrl);

          const html = response.data;
          const $ = cheerio.load(html);

          // Get title and description from first page
          if (!mainTitle) {
            mainTitle = $('title').text() || $('h1').first().text() || 'Untitled';
            mainDescription = $('meta[name="description"]').attr('content') || '';
          }

          // Remove unwanted elements
          $('script').remove();
          $('style').remove();
          $('nav').remove();
          $('footer').remove();
          $('header').remove();
          $('iframe').remove();
          $('noscript').remove();

          // Extract main content
          let pageContent = '';
          const mainSelectors = [
            'main',
            'article',
            '[role="main"]',
            '.main-content',
            '#main-content',
            '.content',
            '#content',
          ];

          for (const selector of mainSelectors) {
            const element = $(selector);
            if (element.length > 0) {
              pageContent = element.text();
              break;
            }
          }

          // If no main content found, get body text
          if (!pageContent) {
            pageContent = $('body').text();
          }

          // Clean up whitespace
          pageContent = pageContent
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '\n')
            .trim();

          // Add to combined content with separator
          if (pageContent && pageContent.length > 50) {
            allContent += `\n\n--- Page: ${currentUrl} ---\n${pageContent}`;
          }

          // Find more links on the same domain
          if (visitedUrls.size < maxPages) {
            $('a[href]').each((_, element) => {
              const href = $(element).attr('href');
              if (!href) return;

              try {
                // Resolve relative URLs
                const absoluteUrl = new URL(href, currentUrl).href;
                const linkUrl = new URL(absoluteUrl);

                // Only crawl same domain
                if (
                  linkUrl.hostname === baseUrl.hostname &&
                  !visitedUrls.has(absoluteUrl) &&
                  !toVisit.includes(absoluteUrl) &&
                  toVisit.length + visitedUrls.size < maxPages
                ) {
                  // Skip common non-content URLs
                  const skipPatterns = [
                    '/wp-admin',
                    '/wp-login',
                    '/login',
                    '/register',
                    '/cart',
                    '/checkout',
                    '/account',
                    '.pdf',
                    '.jpg',
                    '.png',
                    '.gif',
                    '.zip',
                    '#',
                  ];

                  if (!skipPatterns.some(pattern => absoluteUrl.includes(pattern))) {
                    toVisit.push(absoluteUrl);
                  }
                }
              } catch {
                // Invalid URL, skip
              }
            });
          }
        } catch (error) {
          console.error(`Error crawling ${currentUrl}:`, error);
          // Continue with next URL
        }

        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`✅ Crawled ${visitedUrls.size} pages from ${baseUrl.hostname}`);

      // Clean up combined content
      allContent = allContent.trim();

      // Limit total content length (max 100,000 characters for crawled content)
      if (allContent.length > 100000) {
        allContent = allContent.substring(0, 100000) + '\n\n... (Content truncated due to length)';
      }

      return {
        title: mainTitle,
        content: allContent,
        description: mainDescription,
      };
    } catch (error) {
      console.error('Error scraping website:', error);
      throw new Error('Failed to scrape website content');
    }
  }

  /**
   * Process uploaded file based on type
   */
  async processFile(
    file: File
  ): Promise<{
    content: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const fileSize = file.size;
    let content = '';
    let fileType = '';

    if (fileName.endsWith('.pdf')) {
      content = await this.extractTextFromPDF(buffer);
      fileType = 'pdf';
    } else if (fileName.endsWith('.docx')) {
      content = await this.extractTextFromWord(buffer);
      fileType = 'word';
    } else if (fileName.endsWith('.txt')) {
      content = buffer.toString('utf-8');
      fileType = 'text';
    } else {
      throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
    }

    return {
      content,
      fileName,
      fileSize,
      fileType,
    };
  }

  /**
   * Validate and sanitize text content
   */
  sanitizeContent(content: string, maxLength: number = 50000): string {
    // Remove excessive whitespace
    let sanitized = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Extract keywords from content (for better AI context)
   */
  extractKeywords(content: string, maxKeywords: number = 20): string[] {
    // Simple keyword extraction
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Count word frequency
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Sort by frequency and get top keywords
    const keywords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);

    return keywords;
  }
}

export const documentProcessor = new DocumentProcessor();
