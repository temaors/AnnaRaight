// Client-side reminder processor utility
// This can be called periodically to process pending email reminders

export class ReminderProcessor {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  // Start automatic processing every 10 minutes
  startAutoProcessing(intervalMinutes: number = 10) {
    if (this.intervalId) {
      console.log('📧 [REMINDER PROCESSOR] Auto-processing already running');
      return;
    }

    console.log(`📧 [REMINDER PROCESSOR] Starting auto-processing every ${intervalMinutes} minutes`);
    
    // Process immediately
    this.processReminders();
    
    // Then schedule recurring processing
    this.intervalId = setInterval(() => {
      this.processReminders();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop automatic processing
  stopAutoProcessing() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('📧 [REMINDER PROCESSOR] Auto-processing stopped');
    }
  }

  // Manually process reminders
  async processReminders(): Promise<{ success: boolean; processed?: number; sent?: number; failed?: number; error?: string }> {
    if (this.isProcessing) {
      console.log('📧 [REMINDER PROCESSOR] Already processing, skipping...');
      return { success: false, error: 'Already processing' };
    }

    this.isProcessing = true;
    
    try {
      console.log('🔄 [REMINDER PROCESSOR] Processing pending reminders...');
      
      const response = await fetch('/api/process-reminders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ [REMINDER PROCESSOR] Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}`);
        return {
          success: true,
          processed: result.processed,
          sent: result.sent,
          failed: result.failed
        };
      } else {
        console.error('❌ [REMINDER PROCESSOR] Error:', result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ [REMINDER PROCESSOR] Error processing reminders:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      this.isProcessing = false;
    }
  }

  // Check if auto-processing is running
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

// Export singleton instance
export const reminderProcessor = new ReminderProcessor();

// Auto-start processing in browser environment
if (typeof window !== 'undefined') {
  // Start processing reminders every 10 minutes
  reminderProcessor.startAutoProcessing(10);
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    reminderProcessor.stopAutoProcessing();
  });
}