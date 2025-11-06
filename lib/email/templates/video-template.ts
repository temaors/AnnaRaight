/**
 * Simple Video Email Template
 */

import {
  createEmailContainer,
  createFooter,
  htmlToPlainText,
} from '../utils/html-builder';
import { emailPreferencesManager } from '@/lib/email-preferences';

export function generateVideoEmail(email: string, firstName: string, videoUrl: string): { html: string; text: string; subject: string } {
  const content = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🎬 Your Video is Ready!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Hi ${firstName}! Here's your personalized video</p>
    </div>

    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
        <h2 style="color: #2d5a2d; margin-top: 0;">📹 Watch Your Video Below</h2>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center;">
            <p style="margin-bottom: 20px; font-size: 16px;">Click the button below to watch your personalized video:</p>
            <a href="${videoUrl}" style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🎬 Watch Video
            </a>
        </div>

        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: #2d5a2d; margin-top: 0;">💡 What You'll Discover:</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Personalized analysis of your situation</li>
                <li>Concrete steps to solve your problems</li>
                <li>Exclusive strategies and methods</li>
                <li>Practical recommendations</li>
            </ul>
        </div>
    </div>

    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
        <p>Best regards,<br>AstroForYou Team</p>
    </div>
  `;

  const token = emailPreferencesManager.generateUnsubscribeToken(email);
  const html = createEmailContainer(content + createFooter(email, token));
  const text = htmlToPlainText(html);
  const subject = `🎬 Your personalized video is ready, ${firstName}!`;

  return { html, text, subject };
}
