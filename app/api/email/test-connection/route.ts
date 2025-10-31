import { NextResponse } from 'next/server';
import EmailManager, { getEmailConfig } from '@/lib/email';

export async function GET() {
  try {
    const emailConfig = getEmailConfig();
    
    // Check if all required config is present
    const requiredConfig = ['smtpServer', 'smtpPort', 'senderEmail', 'senderPassword'];
    const missingConfig = requiredConfig.filter(key => !emailConfig[key as keyof typeof emailConfig]);
    
    if (missingConfig.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing email configuration: ${missingConfig.join(', ')}`,
        config: {
          smtpServer: emailConfig.smtpServer,
          smtpPort: emailConfig.smtpPort,
          senderEmail: emailConfig.senderEmail ? 'configured' : 'missing',
          senderPassword: emailConfig.senderPassword ? 'configured' : 'missing',
          useTLS: emailConfig.useTLS,
          adminEmail: emailConfig.adminEmail
        }
      });
    }

    const emailManager = new EmailManager(emailConfig);
    const testResult = await emailManager.testConnection();

    return NextResponse.json({
      success: testResult.success,
      error: testResult.error,
      config: {
        smtpServer: emailConfig.smtpServer,
        smtpPort: emailConfig.smtpPort,
        senderEmail: emailConfig.senderEmail ? 'configured' : 'missing',
        senderPassword: emailConfig.senderPassword ? 'configured' : 'missing',
        useTLS: emailConfig.useTLS,
        adminEmail: emailConfig.adminEmail
      }
    });

  } catch (error) {
    console.error('Error testing email connection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'connection_test_error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Use GET method for connection test' },
    { status: 405 }
  );
}