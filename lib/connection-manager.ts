/**
 * WhatsApp Connection Manager
 * Handles staggered reconnection and prevents server overload
 */

interface ConnectionQueue {
  userId: string;
  agentId: string;
  priority: number; // Higher = more priority
  retryCount: number;
}

class ConnectionManager {
  private queue: ConnectionQueue[] = [];
  private processing = false;
  private maxConcurrent = 5; // Max concurrent reconnections
  private currentlyConnecting = 0;
  private reconnectDelay = 2000; // 2 seconds between batches
  private maxRetries = 3;

  /**
   * Add connection to queue with priority
   * @param priority 0 = normal, 1 = high (manual reconnect), 2 = critical
   */
  enqueue(userId: string, agentId: string, priority: number = 0) {
    // Check if already in queue
    const exists = this.queue.find(item => item.agentId === agentId);
    if (exists) {
      console.log(`⏭️  Agent ${agentId} already in reconnection queue`);
      return;
    }

    this.queue.push({
      userId,
      agentId,
      priority,
      retryCount: 0,
    });

    // Sort by priority (higher first)
    this.queue.sort((a, b) => b.priority - a.priority);

    console.log(`📋 Added to queue: ${agentId} (priority: ${priority}). Queue size: ${this.queue.length}`);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process connection queue with rate limiting
   */
  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 || this.currentlyConnecting > 0) {
      // Process up to maxConcurrent connections at once
      const batch: ConnectionQueue[] = [];
      while (batch.length < this.maxConcurrent && this.queue.length > 0) {
        const item = this.queue.shift();
        if (item) batch.push(item);
      }

      if (batch.length === 0 && this.currentlyConnecting > 0) {
        // Wait for current connections to finish
        await this.delay(500);
        continue;
      }

      // Process batch
      this.currentlyConnecting += batch.length;
      const promises = batch.map(item => this.connectWithRetry(item));

      try {
        await Promise.allSettled(promises);
      } catch (error) {
        console.error('Error processing connection batch:', error);
      }

      this.currentlyConnecting -= batch.length;

      // Delay before next batch to prevent server overload
      if (this.queue.length > 0) {
        console.log(`⏳ Waiting ${this.reconnectDelay}ms before next batch... (${this.queue.length} remaining)`);
        await this.delay(this.reconnectDelay);
      }
    }

    this.processing = false;
    console.log('✅ Connection queue processed');
  }

  /**
   * Connect with automatic retry on failure
   */
  private async connectWithRetry(item: ConnectionQueue): Promise<void> {
    const { userId, agentId, retryCount } = item;

    try {
      // Import whatsapp service (lazy load to avoid circular dependency)
      const { whatsappServiceFixed } = await import('./whatsapp-service-fixed');

      console.log(`🔄 Connecting agent ${agentId} (attempt ${retryCount + 1}/${this.maxRetries})...`);
      await whatsappServiceFixed.connectWhatsApp(userId, agentId);

      console.log(`✅ Successfully connected agent ${agentId}`);
    } catch (error) {
      console.error(`❌ Failed to connect agent ${agentId}:`, error);

      // Retry if not exceeded max retries
      if (retryCount < this.maxRetries - 1) {
        console.log(`🔄 Retrying agent ${agentId}... (${retryCount + 1}/${this.maxRetries})`);

        // Re-add to queue with incremented retry count and lower priority
        this.queue.push({
          userId,
          agentId,
          priority: 0, // Lower priority for retries
          retryCount: retryCount + 1,
        });
      } else {
        console.error(`❌ Max retries exceeded for agent ${agentId}, giving up`);
      }
    }
  }

  /**
   * Clear all pending connections
   */
  clearQueue() {
    const clearedCount = this.queue.length;
    this.queue = [];
    console.log(`🗑️  Cleared ${clearedCount} pending connections from queue`);
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      currentlyConnecting: this.currentlyConnecting,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const connectionManager = new ConnectionManager();
