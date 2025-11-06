/**
 * HTML Email Builder Utilities
 * DRY helpers for building email HTML
 */

import { DEFAULT_BASE_URL } from '../core/config';

export interface EmailStyles {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

const defaultStyles: EmailStyles = {
  primaryColor: '#4A148C',
  secondaryColor: '#7B1FA2',
  accentColor: '#FF6B35',
};

/**
 * Create email container wrapper
 */
export function createEmailContainer(content: string): string {
  return `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        ${content}
      </div>
    </body>
    </html>
  `;
}

/**
 * Create gradient header
 */
export function createHeader(title: string, subtitle?: string, styles?: EmailStyles): string {
  const s = { ...defaultStyles, ...styles };

  return `
    <div style="background: linear-gradient(135deg, ${s.primaryColor} 0%, ${s.secondaryColor} 50%, #8E24AA 100%);
                color: white; padding: 30px; border-radius: 15px; text-align: center; position: relative; overflow: hidden;">
      <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px;
                  background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px;
                  background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
      <h1 style="margin: 0; font-size: 32px; margin-bottom: ${subtitle ? '10px' : '0'};">${title}</h1>
      ${subtitle ? `<p style="margin: 0; font-size: 18px; opacity: 0.9;">${subtitle}</p>` : ''}
    </div>
  `;
}

/**
 * Create content section
 */
export function createContentSection(content: string): string {
  return `
    <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-top: 20px;">
      ${content}
    </div>
  `;
}

/**
 * Create CTA button
 */
export function createButton(text: string, url: string, styles?: EmailStyles): string {
  const s = { ...defaultStyles, ...styles };

  return `
    <div style="text-align: center; margin: 25px 0;">
      <a href="${url}"
         style="display: inline-block;
                background: linear-gradient(135deg, ${s.accentColor} 0%, #F7931E 100%);
                color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px;
                font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(255,107,53,0.3);
                transition: all 0.3s ease;">
        ${text}
      </a>
    </div>
  `;
}

/**
 * Create bullet list
 */
export function createBulletList(items: string[], icon: string = '⭐'): string {
  const listItems = items.map(item => `
    <li style="margin-bottom: 12px; padding-left: 25px; position: relative;">
      <span style="position: absolute; left: 0; color: #FF6B35; font-size: 16px;">${icon}</span>
      ${item}
    </li>
  `).join('');

  return `<ul style="margin: 0; padding-left: 0; list-style: none;">${listItems}</ul>`;
}

/**
 * Create info box
 */
export function createInfoBox(title: string, content: string, bgColor: string = '#E8F5E8', borderColor: string = '#4CAF50'): string {
  return `
    <div style="background: ${bgColor}; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid ${borderColor};">
      <h3 style="color: ${borderColor}; margin-top: 0; margin-bottom: 15px; font-size: 20px;">${title}</h3>
      ${content}
    </div>
  `;
}

/**
 * Create footer
 */
export function createFooter(email: string, token: string): string {
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;
                font-size: 12px; color: #666; text-align: center;">
      <p>You received this email because you subscribed to our notifications.</p>
      <p>
        <a href="${DEFAULT_BASE_URL}/preferences?email=${encodeURIComponent(email)}&token=${token}"
           style="color: #667eea; text-decoration: none;">Manage subscription</a> |
        <a href="${DEFAULT_BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}"
           style="color: #667eea; text-decoration: none;">Unsubscribe from all emails</a>
      </p>
      <p style="margin-top: 15px;">
        © 2025 AstroForYou. All rights reserved.<br>
        If you have any questions, contact us.
      </p>
    </div>
  `;
}

/**
 * Convert HTML to plain text (simple version)
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Create greeting
 */
export function createGreeting(name: string): string {
  return `<p style="font-size: 18px; margin-bottom: 20px;">Dear <strong>${name}</strong>,</p>`;
}

/**
 * Create signature
 */
export function createSignature(name: string = 'Anna Raight', title: string = 'Founder, AstroForYou Academy'): string {
  return `
    <div style="text-align: center; margin-top: 30px; padding: 25px; background: #f8f9fa; border-radius: 15px;">
      <p style="margin-bottom: 15px; font-size: 16px; font-style: italic; color: #666;">Cosmically yours,</p>
      <p style="margin-bottom: 5px; font-size: 18px; font-weight: bold; color: #4A148C;">${name}</p>
      <p style="margin-bottom: 20px; font-size: 14px; color: #666;">${title}</p>
    </div>
  `;
}
