import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export type FunnelStage = 
  | 'new' 
  | 'video_started' 
  | 'video_completed' 
  | 'appointment_scheduled' 
  | 'appointment_attended' 
  | 'invoice_sent' 
  | 'paid_customer';

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'attended' 
  | 'no_show' 
  | 'cancelled' 
  | 'rescheduled';

export type InvoiceStatus = 
  | 'draft' 
  | 'sent' 
  | 'viewed' 
  | 'paid' 
  | 'overdue' 
  | 'cancelled';

export interface StatusUpdate {
  leadId: number;
  oldStatus?: string;
  newStatus: string;
  statusType: 'funnel_stage' | 'appointment' | 'payment';
  triggerEvent?: string;
  notes?: string;
  adminUserId?: number;
}

export interface EngagementEvent {
  leadId: number;
  eventType: string;
  eventData?: Record<string, unknown>;
  scoreValue?: number;
}

// Database row interfaces
interface LeadRow {
  funnel_stage: FunnelStage;
}

interface LeadStatusRow {
  id: number;
  funnel_stage: FunnelStage;
  engagement_score: number;
  last_activity: string;
}

interface StatusHistoryRow {
  id: number;
  lead_id: number;
  old_status?: string;
  new_status: string;
  status_type: string;
  trigger_event?: string;
  notes?: string;
  admin_user_id?: number;
  created_at: string;
}

interface EngagementEventRow {
  id: number;
  lead_id: number;
  event_type: string;
  event_data?: string;
  score_value?: number;
  created_at: string;
}

interface LeadsByStageRow {
  id: number;
  email: string;
  name?: string;
  funnel_stage: FunnelStage;
  engagement_score: number;
  last_activity: string;
  created_at: string;
}

interface StageStatsRow {
  funnel_stage: FunnelStage;
  count: number;
  avg_score: number;
  max_score: number;
}

interface TotalLeadsRow {
  total: number;
}

export class StatusManager {
  private getDatabase() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return new Database(path.join(dataDir, 'funnel.db'));
  }

  // Update lead funnel stage
  async updateLeadStatus(leadId: number, newStage: FunnelStage, triggerEvent?: string, adminUserId?: number): Promise<boolean> {
    const db = this.getDatabase();
    try {
      // Get current status
      const currentLead = db.prepare('SELECT funnel_stage FROM leads WHERE id = ?').get(leadId) as LeadRow | undefined;
      if (!currentLead) return false;

      const oldStage = currentLead.funnel_stage;
      
      // Map funnel_stage to funnel_step for admin display
      const stepMapping: Record<FunnelStage, string> = {
        'new': 'vsl_optin',
        'video_started': 'video_watching', 
        'video_completed': 'video_completed',
        'appointment_scheduled': 'appointment_scheduled',
        'appointment_attended': 'appointment_attended',
        'invoice_sent': 'invoice_sent',
        'paid_customer': 'paid_customer'
      };

      // Update lead status (both columns)
      db.prepare(`
        UPDATE leads 
        SET funnel_stage = ?, funnel_step = ?, last_activity = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(newStage, stepMapping[newStage] || newStage, leadId);

      // Record status history
      await this.recordStatusHistory({
        leadId,
        oldStatus: oldStage,
        newStatus: newStage,
        statusType: 'funnel_stage',
        triggerEvent,
        adminUserId
      });

      // Update engagement score based on stage progression
      await this.updateEngagementScore(leadId, this.getStageScore(newStage));

      return true;
    } catch (error) {
      console.error('Error updating lead status:', error);
      return false;
    } finally {
      db.close();
    }
  }

  // Record status history
  async recordStatusHistory(update: StatusUpdate): Promise<void> {
    const db = this.getDatabase();
    try {
      db.prepare(`
        INSERT INTO status_history (lead_id, old_status, new_status, status_type, trigger_event, notes, admin_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        update.leadId,
        update.oldStatus,
        update.newStatus,
        update.statusType,
        update.triggerEvent,
        update.notes,
        update.adminUserId
      );
    } finally {
      db.close();
    }
  }

  // Record engagement event
  async recordEngagementEvent(event: EngagementEvent): Promise<void> {
    const db = this.getDatabase();
    try {
      db.prepare(`
        INSERT INTO engagement_events (lead_id, event_type, event_data, score_value)
        VALUES (?, ?, ?, ?)
      `).run(
        event.leadId,
        event.eventType,
        event.eventData ? JSON.stringify(event.eventData) : null,
        event.scoreValue || 0
      );

      // Update total engagement score
      if (event.scoreValue && event.scoreValue > 0) {
        await this.updateEngagementScore(event.leadId, event.scoreValue);
      }
    } finally {
      db.close();
    }
  }

  // Update engagement score
  private async updateEngagementScore(leadId: number, additionalScore: number): Promise<void> {
    const db = this.getDatabase();
    try {
      db.prepare(`
        UPDATE leads 
        SET engagement_score = engagement_score + ?, last_activity = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(additionalScore, leadId);
    } finally {
      db.close();
    }
  }

  // Get score value for funnel stage
  private getStageScore(stage: FunnelStage): number {
    const stageScores: Record<FunnelStage, number> = {
      'new': 0,
      'video_started': 10,
      'video_completed': 25,
      'appointment_scheduled': 50,
      'appointment_attended': 75,
      'invoice_sent': 85,
      'paid_customer': 100
    };
    return stageScores[stage] || 0;
  }

  // Auto-update status based on video completion
  async handleVideoCompletion(leadId: number, videoPage: string, completionPercentage: number): Promise<void> {
    if (completionPercentage >= 80) { // Consider 80%+ as completed
      await this.updateLeadStatus(leadId, 'video_completed', `video_completion_${videoPage}`);
      await this.recordEngagementEvent({
        leadId,
        eventType: 'video_completed',
        eventData: { videoPage, completionPercentage },
        scoreValue: 25
      });
    } else if (completionPercentage >= 25) { // 25%+ as started
      const currentLead = await this.getLeadStatus(leadId);
      if (currentLead?.funnel_stage === 'new') {
        await this.updateLeadStatus(leadId, 'video_started', `video_start_${videoPage}`);
      }
      await this.recordEngagementEvent({
        leadId,
        eventType: 'video_progress',
        eventData: { videoPage, completionPercentage },
        scoreValue: Math.floor(completionPercentage / 10) // 1 point per 10%
      });
    }
  }

  // Auto-update status based on appointment booking
  async handleAppointmentScheduled(leadId: number, appointmentId: number): Promise<void> {
    await this.updateLeadStatus(leadId, 'appointment_scheduled', `appointment_booked_${appointmentId}`);
    await this.recordEngagementEvent({
      leadId,
      eventType: 'appointment_scheduled',
      eventData: { appointmentId },
      scoreValue: 50
    });
  }

  // Auto-update status based on appointment attendance
  async handleAppointmentAttended(leadId: number, appointmentId: number): Promise<void> {
    await this.updateLeadStatus(leadId, 'appointment_attended', `appointment_attended_${appointmentId}`);
    await this.recordEngagementEvent({
      leadId,
      eventType: 'appointment_attended',
      eventData: { appointmentId },
      scoreValue: 25
    });
  }

  // Auto-update status based on invoice creation
  async handleInvoiceSent(leadId: number, invoiceId: string): Promise<void> {
    await this.updateLeadStatus(leadId, 'invoice_sent', `invoice_sent_${invoiceId}`);
    await this.recordEngagementEvent({
      leadId,
      eventType: 'invoice_sent',
      eventData: { invoiceId },
      scoreValue: 10
    });
  }

  // Auto-update status based on payment completion
  async handlePaymentCompleted(leadId: number, invoiceId: string, amount: number): Promise<void> {
    await this.updateLeadStatus(leadId, 'paid_customer', `payment_completed_${invoiceId}`);
    await this.recordEngagementEvent({
      leadId,
      eventType: 'payment_completed',
      eventData: { invoiceId, amount },
      scoreValue: 100
    });
  }

  // Get lead current status
  async getLeadStatus(leadId: number): Promise<LeadStatusRow | undefined> {
    const db = this.getDatabase();
    try {
      return db.prepare(`
        SELECT id, funnel_stage, engagement_score, last_activity 
        FROM leads 
        WHERE id = ?
      `).get(leadId) as LeadStatusRow | undefined;
    } finally {
      db.close();
    }
  }

  // Get status history for a lead
  async getStatusHistory(leadId: number): Promise<StatusHistoryRow[]> {
    const db = this.getDatabase();
    try {
      return db.prepare(`
        SELECT * FROM status_history 
        WHERE lead_id = ? 
        ORDER BY created_at DESC
      `).all(leadId) as StatusHistoryRow[];
    } finally {
      db.close();
    }
  }

  // Get engagement events for a lead
  async getEngagementEvents(leadId: number): Promise<EngagementEventRow[]> {
    const db = this.getDatabase();
    try {
      return db.prepare(`
        SELECT * FROM engagement_events 
        WHERE lead_id = ? 
        ORDER BY created_at DESC
      `).all(leadId) as EngagementEventRow[];
    } finally {
      db.close();
    }
  }

  // Get leads by funnel stage
  async getLeadsByStage(stage: FunnelStage): Promise<LeadsByStageRow[]> {
    const db = this.getDatabase();
    try {
      return db.prepare(`
        SELECT * FROM leads 
        WHERE funnel_stage = ? 
        ORDER BY last_activity DESC
      `).all(stage) as LeadsByStageRow[];
    } finally {
      db.close();
    }
  }

  // Get engagement statistics
  async getEngagementStats(): Promise<{
    byStage: StageStatsRow[];
    totalLeads: number;
    conversionRates: Record<string, number>;
  }> {
    const db = this.getDatabase();
    try {
      const stats = db.prepare(`
        SELECT 
          funnel_stage,
          COUNT(*) as count,
          AVG(engagement_score) as avg_score,
          MAX(engagement_score) as max_score
        FROM leads 
        GROUP BY funnel_stage
      `).all() as StageStatsRow[];

      const totalLeads = db.prepare('SELECT COUNT(*) as total FROM leads').get() as TotalLeadsRow;
      
      return {
        byStage: stats,
        totalLeads: totalLeads.total,
        conversionRates: this.calculateConversionRates(stats)
      };
    } finally {
      db.close();
    }
  }

  private calculateConversionRates(stageStats: StageStatsRow[]): Record<string, number> {
    const stageOrder: FunnelStage[] = ['new', 'video_started', 'video_completed', 'appointment_scheduled', 'appointment_attended', 'invoice_sent', 'paid_customer'];
    const rates: Record<string, number> = {};
    
    for (let i = 1; i < stageOrder.length; i++) {
      const currentStage = stageOrder[i];
      const previousStage = stageOrder[i - 1];
      
      const currentCount = stageStats.find(s => s.funnel_stage === currentStage)?.count || 0;
      const previousCount = stageStats.find(s => s.funnel_stage === previousStage)?.count || 0;
      
      rates[`${previousStage}_to_${currentStage}`] = previousCount > 0 ? (currentCount / previousCount) * 100 : 0;
    }
    
    return rates;
  }
}

// Export singleton instance
export const statusManager = new StatusManager();