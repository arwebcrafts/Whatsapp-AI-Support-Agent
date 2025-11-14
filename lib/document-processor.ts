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
   * Scrape text content from website URL
   */
  async scrapeWebsite(url: string): Promise<{
    title: string;
    content: string;
    description?: string;
  }> {
    try {
      // Validate URL
      new URL(url);

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'WhaSales-AI-Bot/1.0',
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Remove script, style, and nav elements
      $('script').remove();
      $('style').remove();
      $('nav').remove();
      $('footer').remove();
      $('header').remove();

      // Get title
      const title = $('title').text() || $('h1').first().text() || 'Untitled';

      // Get meta description
      const description = $('meta[name="description"]').attr('content') || '';

      // Extract main content
      // Try to find main content area
      let content = '';
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
          content = element.text();
          break;
        }
      }

      // If no main content found, get body text
      if (!content) {
        content = $('body').text();
      }

      // Clean up whitespace
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      // Limit content length (max 50,000 characters)
      if (content.length > 50000) {
        content = content.substring(0, 50000) + '...';
      }

      return {
        title,
        content,
        description,
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
