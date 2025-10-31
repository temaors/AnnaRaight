import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { promises as fs } from 'fs';
import path from 'path';
import { generateGoogleMeetLink } from './google-meet';

interface AppointmentData {
  appointment_date: string;
  appointment_time: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  revenue?: string;
  google_meet_link?: string;
  meeting_id?: string;
  timezone?: string;
}

interface CalendarResponse {
  success: boolean;
  event_id?: string;
  html_link?: string;
  google_meet_link?: string;
  meeting_id?: string;
  message?: string;
}



interface TokenData {
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
  expiry?: string;
}

// Generate time slots from 00:00 to 23:30 with 30-minute intervals
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

// Time slots configuration - full day with 30-minute intervals
const TIME_SLOTS = generateTimeSlots();

// Cache for available slots
interface SlotCache {
  [dateStr: string]: {
    slots: string[];
    timestamp: number;
  };
}

export class GoogleCalendarManager {
  private oauth2Client: OAuth2Client | null = null;
  private calendar: ReturnType<typeof google.calendar> | null = null;
  private isAvailable = false;
  private isInitializing = false;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private slotsCache: SlotCache = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly SCOPES = ['https://www.googleapis.com/auth/calendar'];
  private readonly CREDENTIALS_PATH = this.getCredentialsPath();
  private readonly TOKEN_PATH = this.getTokenPath();
  
  private getCredentialsPath(): string {
    // Try multiple possible paths (especially for Windows IIS)
    const possiblePaths = [
      path.join(process.cwd(), 'database', 'credentials.json'),
      path.join(__dirname, '..', '..', 'database', 'credentials.json'),
      path.join(process.env.INIT_CWD || process.cwd(), 'database', 'credentials.json'),
      path.join(process.env.IISNODE_VERSION ? 'D:\\inetpub\\wwwroot\\annaraight' : process.cwd(), 'database', 'credentials.json'),
      path.join('C:\\inetpub\\wwwroot\\annaraight', 'database', 'credentials.json'),
      path.resolve('./database/credentials.json'),
      path.resolve('database/credentials.json'),
      './database/credentials.json'
    ];
    
    for (const p of possiblePaths) {
      try {
        console.log('🔍 Checking credentials path:', p);
        if (require('fs').existsSync(p)) {
          console.log('✅ Found credentials at:', p);
          return p;
        }
      } catch (e) {
        console.log('❌ Error checking credentials path:', p, e.message);
      }
    }
    
    console.log('❌ No credentials file found in any of the paths');
    // Default to first path
    return possiblePaths[0];
  }
  
  private getTokenPath(): string {
    // Try multiple possible paths (especially for Windows IIS)
    const possiblePaths = [
      path.join(process.cwd(), 'database', 'token.json'),
      path.join(__dirname, '..', '..', 'database', 'token.json'),
      path.join(process.env.INIT_CWD || process.cwd(), 'database', 'token.json'),
      path.join(process.env.IISNODE_VERSION ? 'D:\\inetpub\\wwwroot\\annaraight' : process.cwd(), 'database', 'token.json'),
      path.join('C:\\inetpub\\wwwroot\\annaraight', 'database', 'token.json'),
      path.resolve('./database/token.json'),
      path.resolve('database/token.json'),
      './database/token.json'
    ];
    
    for (const p of possiblePaths) {
      try {
        console.log('🔍 Checking token path:', p);
        if (require('fs').existsSync(p)) {
          console.log('✅ Found token at:', p);
          return p;
        }
      } catch (e) {
        console.log('❌ Error checking token path:', p, e.message);
      }
    }
    
    console.log('❌ No token file found in any of the paths');
    // Default to first path
    return possiblePaths[0];
  }

  constructor() {
    // Don't initialize in constructor
  }
  
  private clearSlotsCache(): void {
    this.slotsCache = {};
  }

  // Method to ensure initialization is complete
  public async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }
    
    this.isInitializing = true;
    this.initPromise = this.initializeCredentials();
    
    try {
      await this.initPromise;
      this.isInitialized = true;
    } finally {
      this.isInitializing = false;
    }
  }

  private async initializeCredentials(): Promise<void> {
    try {
      console.log('🔍 Google Calendar initialization started...');
      console.log('📁 Current working directory:', process.cwd());
      console.log('📁 Credentials path:', this.CREDENTIALS_PATH);
      console.log('📁 Token path:', this.TOKEN_PATH);
      
      // Check if credentials file exists
      const credentialsExist = await this.fileExists(this.CREDENTIALS_PATH);
      
      if (!credentialsExist) {
        console.log('❌ Google Calendar credentials not found at:', this.CREDENTIALS_PATH);
        return;
      }
      
      console.log('✅ Credentials file found');

      // Load credentials to initialize OAuth2Client
      const credentialsContent = await fs.readFile(this.CREDENTIALS_PATH, 'utf8');
      const credentials = JSON.parse(credentialsContent);
      const { client_id, client_secret, redirect_uris } = credentials.web;
      
      // Initialize OAuth2Client with credentials
      this.oauth2Client = new OAuth2Client(
        client_id,
        client_secret,
        redirect_uris[0] // Use first redirect URI
      );

      // Load token if exists
      const tokenExists = await this.fileExists(this.TOKEN_PATH);
      console.log('📄 Token file exists:', tokenExists);
      
      if (tokenExists) {
        console.log('✅ Token file found');
        try {
          const tokenContent = await fs.readFile(this.TOKEN_PATH, 'utf8');
          
          // Check if file contains Python pickle data (starts with specific bytes)
          if (tokenContent.startsWith('���') || tokenContent.includes('�')) {
            console.error('❌ Token file appears to be in Python pickle format, not JSON');
            console.log('🗑️ Removing incompatible token file...');
            await fs.unlink(this.TOKEN_PATH);
            throw new Error('Token file is in incompatible format (Python pickle)');
          }
          
          let tokenData: TokenData;
          try {
            tokenData = JSON.parse(tokenContent) as TokenData;
          } catch (parseError) {
            console.error('❌ Failed to parse token.json:', parseError);
            console.log('🗑️ Removing corrupted token file...');
            await fs.unlink(this.TOKEN_PATH);
            throw new Error('Token file contains invalid JSON');
          }
          // Token loaded successfully

          // Use google.auth.fromJSON for better compatibility (like in Python version)
          const auth = google.auth.fromJSON({
            type: 'authorized_user',
            client_id: tokenData.client_id,
            client_secret: tokenData.client_secret,
            refresh_token: tokenData.refresh_token
          });

          // Set up automatic token refresh
          auth.on('tokens', async (tokens: any) => {
            console.log('🔄 Google Calendar token automatically refreshed');
            try {
              // Update the token file with new credentials
              const updatedToken = {
                client_id: tokenData.client_id,
                client_secret: tokenData.client_secret,
                refresh_token: tokenData.refresh_token,
                access_token: tokens.access_token,
                expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : tokenData.expiry
              };
              
              await fs.writeFile(this.TOKEN_PATH, JSON.stringify(updatedToken, null, 2));
              console.log('✅ Token file updated with new expiry:', updatedToken.expiry);
            } catch (saveError) {
              console.error('❌ Failed to save refreshed token:', saveError);
            }
          });

          // Check if token needs refresh (but don't force it, let googleapis handle it automatically)
          const isExpired = tokenData.expiry && new Date(tokenData.expiry) <= new Date();
          if (isExpired) {
            console.log('🔄 Token expired, will refresh automatically on next API call');
          }

          this.oauth2Client = auth as OAuth2Client;
          this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
          
          // Test calendar access
          try {
            await this.calendar.calendarList.list();
            this.isAvailable = true;
            console.log('✅ Google Calendar service initialized successfully');
          } catch (testError) {
            console.error('❌ Calendar access test failed:', testError);
            this.isAvailable = false;
          }
          
        } catch (error) {
          console.warn('Failed to load or refresh token:', error);
          // Google Calendar will work in fallback mode
          this.isAvailable = false;
        }
      } else {
        // No token file found. Google Calendar will work in fallback mode
        this.isAvailable = false;
      }
    } catch (error) {
      console.warn('Google Calendar setup failed:', error);
      this.isAvailable = false;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      if (this.oauth2Client && this.oauth2Client.credentials.refresh_token) {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        this.oauth2Client.setCredentials(credentials);
        
        // Save refreshed token
        await fs.writeFile(this.TOKEN_PATH, JSON.stringify(credentials));
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.warn('Failed to refresh token:', error);
      this.oauth2Client = null;
      this.isAvailable = false;
    }
  }

  public async getAvailableSlots(dateStr: string): Promise<string[]> {
    try {
      if (!this.isAvailable || !this.calendar) {
        console.log(`⚠️ Google Calendar not available, returning all ${TIME_SLOTS.length} slots, last: ${TIME_SLOTS[TIME_SLOTS.length - 1]}`);
        return TIME_SLOTS;
      }

      // Convert date string to Date objects
      const date = new Date(dateStr);
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      // Get events for the day
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      console.log(`📊 Google Calendar returned ${events.length} events for ${dateStr}`);

      // Create busy time ranges
      const busyTimes: Array<{ start: Date; end: Date }> = [];
      events.forEach((event) => {
        console.log(`📅 Event: "${event.summary}" from ${event.start?.dateTime} to ${event.end?.dateTime}`);
        if (event.start?.dateTime && event.end?.dateTime) {
          busyTimes.push({
            start: new Date(event.start.dateTime),
            end: new Date(event.end.dateTime)
          });
        }
      });

      // Filter available slots
      const availableSlots: string[] = [];
      const blockedSlots: string[] = [];
      
      TIME_SLOTS.forEach(slot => {
        const [hours, minutes] = slot.split(':').map(Number);
        const slotDateTime = new Date(date);
        slotDateTime.setHours(hours, minutes, 0, 0);

        // Check if slot conflicts with any busy time
        const conflictingEvent = busyTimes.find(busy => 
          slotDateTime >= busy.start && slotDateTime < busy.end
        );

        if (conflictingEvent) {
          blockedSlots.push(slot);
          if (slot === '18:00' || slot === '19:00' || slot === '20:00') {
            console.log(`🚫 Slot ${slot} blocked by event from ${conflictingEvent.start.toISOString()} to ${conflictingEvent.end.toISOString()}`);
          }
        } else {
          availableSlots.push(slot);
        }
      });
      
      console.log(`🔒 Blocked ${blockedSlots.length} slots:`, blockedSlots.slice(0, 5), blockedSlots.length > 5 ? '...' : '');

      console.log(`📅 Available slots for ${dateStr}:`, availableSlots.length, 'slots');
      console.log(`🕐 Last available slot:`, availableSlots[availableSlots.length - 1]);
      console.log(`🚫 Busy times:`, busyTimes.map(b => `${b.start.toLocaleTimeString()} - ${b.end.toLocaleTimeString()}`));
      console.log(`📝 Total TIME_SLOTS:`, TIME_SLOTS.length, 'slots');
      console.log(`🎯 TIME_SLOTS range:`, TIME_SLOTS[0], 'to', TIME_SLOTS[TIME_SLOTS.length - 1]);
      
      if (busyTimes.length > 0) {
        console.log(`🔍 Detailed busy times:`);
        busyTimes.forEach((busy, index) => {
          console.log(`  ${index + 1}. ${busy.start.toISOString()} - ${busy.end.toISOString()}`);
        });
      }

      // Cache and return available slots
      const finalSlots = availableSlots.length > 0 ? availableSlots : TIME_SLOTS;
      this.slotsCache[dateStr] = { slots: finalSlots, timestamp: Date.now() };
      return finalSlots;

    } catch (error) {
      console.error('Error getting available slots from Google Calendar:', error);
      // Cache and return fallback slots
      const fallbackSlots = TIME_SLOTS;
      console.log(`⚠️ Fallback: returning ${fallbackSlots.length} slots, last slot: ${fallbackSlots[fallbackSlots.length - 1]}`);
      this.slotsCache[dateStr] = { slots: fallbackSlots, timestamp: Date.now() };
      return fallbackSlots;
    }
  }

  public async createAppointment(appointmentData: AppointmentData): Promise<CalendarResponse> {
    try {
      console.log('🔥 createAppointment called with:', {
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        name: appointmentData.name,
        email: appointmentData.email
      });
      
      console.log('📊 Calendar availability check:', {
        isAvailable: this.isAvailable,
        hasCalendar: !!this.calendar,
        hasOAuthClient: !!this.oauth2Client
      });

      if (!this.isAvailable || !this.calendar) {
        console.log('❌ Google Calendar not available, skipping calendar event creation');
        return {
          success: true,
          event_id: undefined,
          html_link: undefined,
          message: 'Appointment saved locally (Google Calendar not configured)'
        };
      }

      console.log('✅ Google Calendar is available, proceeding with event creation...');

      // Parse appointment data
      const {
        appointment_date = '2025-08-23',
        appointment_time = '11:00',
        name = 'Client',
        email = '',
        phone = '',
        website = '',
        revenue = '',
        timezone = 'Europe/Moscow'
      } = appointmentData;

      // Generate Google Meet link if not provided
      let { google_meet_link = '', meeting_id = '' } = appointmentData;
      if (!google_meet_link) {
        const meetInfo = generateGoogleMeetLink();
        google_meet_link = meetInfo.meeting_link;
        meeting_id = meetInfo.meeting_id;
      }

      // Create event datetime
      const [hours, minutes] = appointment_time.split(':').map(Number);
      const eventDateTime = new Date(appointment_date);
      eventDateTime.setHours(hours, minutes, 0, 0);

      const endDateTime = new Date(eventDateTime);
      endDateTime.setHours(eventDateTime.getHours() + 1); // 1 hour duration

      // Create description with only filled fields
      let description = `👤 Guests: 1

📋 Client Information:
• Name: ${name}
• Email: ${email}`;
      
      if (phone && phone.trim()) {
        description += `\n• Phone: ${phone}`;
      }
      if (website && website.trim()) {
        description += `\n• Website: ${website}`;
      }
      if (revenue && revenue.trim()) {
        description += `\n• Revenue: ${revenue}`;
      }
      
      description += `\n\n⏰ Time: ${appointment_time}\n🌍 Timezone: ${timezone}\n\n📝 Booked through sales funnel.`;

      // Add Google Meet link if available
      if (google_meet_link) {
        description += `\n\n🎥 Join Meeting:\n${google_meet_link}\n\n🎬 Meeting ID: ${meeting_id}`;
      }

      // Event details
      const event = {
        summary: `Consultation with ${name}`,
        description: description,
        start: {
          dateTime: eventDateTime.toISOString(),
          timeZone: timezone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: timezone,
        },
        attendees: [
          { email: email },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 },      // 30 min before
          ],
        },
      };

      // Create the event
      console.log('🔄 Attempting to create Google Calendar event...');
      console.log('📅 Event details:', {
        summary: event.summary,
        start: event.start.dateTime,
        end: event.end.dateTime,
        timeZone: event.start.timeZone,
        attendeesCount: event.attendees?.length || 0
      });
      
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'none', // Отключаем автоматические уведомления от Google Calendar
      });

      console.log(`✅ Appointment created in Google Calendar: ${response.data.id}`);
      console.log('📍 Event URL:', response.data.htmlLink);
      
      // Clear cache since we created a new event
      this.clearSlotsCache();

      return {
        success: true,
        event_id: response.data.id || undefined,
        html_link: response.data.htmlLink || undefined,
        google_meet_link,
        meeting_id
      };

    } catch (error) {
      console.error('❌ Error creating appointment in Google Calendar:', error);
      
      // Detailed error logging
      if (error instanceof Error) {
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      
      // Check for API errors
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        console.error('❌ API Error status:', apiError.response?.status);
        console.error('❌ API Error data:', apiError.response?.data);
      }
      
      return {
        success: false,
        event_id: undefined,
        html_link: undefined,
        message: `Google Calendar error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public async updateAppointment(eventId: string, appointmentData: AppointmentData): Promise<CalendarResponse> {
    try {
      if (!this.isAvailable || !this.calendar || !eventId) {
        console.log('Google Calendar not available or no event ID, skipping update');
        return { success: true, message: 'Appointment updated locally' };
      }

      // Get existing event
      const existingEvent = await this.calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
      });

      const event = existingEvent.data;

      // Create updated description
      const {
        name = 'Client',
        email = '',
        phone = '',
        website = '',
        revenue = '',
        google_meet_link = '',
        meeting_id = '',
        timezone = 'Europe/Moscow'
      } = appointmentData;

      let description = `👤 Guests: 1\n\n📋 Client Information:\n• Name: ${name}\n• Email: ${email}`;
      
      if (phone && phone.trim()) {
        description += `\n• Phone: ${phone}`;
      }
      if (website && website.trim()) {
        description += `\n• Website: ${website}`;
      }
      if (revenue && revenue.trim()) {
        description += `\n• Revenue: ${revenue}`;
      }
      
      description += `\n\n🌍 Timezone: ${timezone}\n\n📝 Booked through sales funnel.`;

      // Add Google Meet link if available
      if (google_meet_link) {
        description += `\n\n🎥 Join Meeting:\n${google_meet_link}\n\n🎬 Meeting ID: ${meeting_id}`;
      }

      // Update event details
      event.summary = `Consultation with ${name}`;
      event.description = description;

      // Update the event
      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event,
        sendUpdates: 'none', // Отключаем автоматические уведомления от Google Calendar
      });

      console.log(`Appointment updated in Google Calendar: ${eventId}`);

      return {
        success: true,
        event_id: response.data.id || undefined,
        html_link: response.data.htmlLink || undefined
      };

    } catch (error) {
      console.error('Error updating appointment in Google Calendar:', error);
      return { success: true, message: 'Appointment updated locally (Google Calendar error)' };
    }
  }

  public async deleteAppointment(eventId: string): Promise<CalendarResponse> {
    try {
      if (!this.isAvailable || !this.calendar || !eventId) {
        console.log('Google Calendar not available or no event ID, skipping deletion');
        return { success: true, message: 'Appointment deleted locally' };
      }

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'none', // Отключаем автоматические уведомления от Google Calendar
      });

      console.log(`Appointment deleted from Google Calendar: ${eventId}`);

      return { success: true };

    } catch (error) {
      console.error('Error deleting appointment from Google Calendar:', error);
      return { success: true, message: 'Appointment deleted locally (Google Calendar error)' };
    }
  }

  public isGoogleCalendarAvailable(): boolean {
    return this.isAvailable && this.calendar !== null;
  }

  public getAuthUrl(): string {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
    });
  }

  public async getTokenFromCode(code: string): Promise<void> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Save the credentials for future use
    await fs.writeFile(this.TOKEN_PATH, JSON.stringify(tokens));
    
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    this.isAvailable = true;
    console.log('Google Calendar authentication successful');
  }
}

// Export singleton instance
// Singleton instance
let instance: GoogleCalendarManager | null = null;

export const googleCalendarManager = (() => {
  if (!instance) {
    instance = new GoogleCalendarManager();
  }
  return instance;
})();