/**
 * Welcome Email Template
 */

import {
  createEmailContainer,
  createHeader,
  createContentSection,
  createButton,
  createBulletList,
  createGreeting,
  createSignature,
  createFooter,
  htmlToPlainText,
} from '../utils/html-builder';
import { emailPreferencesManager } from '@/lib/email-preferences';

export interface WelcomeEmailData {
  email: string;
  firstName: string;
  videoUrl: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): { html: string; text: string } {
  const { email, firstName, videoUrl } = data;

  const content = `
    ${createHeader('Welcome to AstroForYou 🌌', 'Your video is here!')}
    ${createContentSection(`
      ${createGreeting(firstName)}

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Welcome to the AstroForYou family! 🌟
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        I'm Anna Raight, and I'm so excited you've decided to explore the world of scientific astrology with me.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
        As promised, here's the video you signed up to watch 👇
      </p>

      <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <div style="margin-bottom: 20px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #4A148C 0%, #7B1FA2 100%); color: white; padding: 3px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-bottom: 15px;">
            🎥 EXCLUSIVE VIDEO
          </div>
        </div>
        ${createButton('👉 Watch your video now', videoUrl)}
      </div>

      <div style="background: linear-gradient(135deg, #E8F5E8 0%, #F0F8F0 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4CAF50;">
        <h3 style="color: #2E7D32; margin-top: 0; margin-bottom: 15px; font-size: 20px;">In this video you'll discover:</h3>
        ${createBulletList([
          '<strong>The #1 reason most astrology feels "wrong"</strong> (and how to fix it)',
          '<strong>The secret method Russian scientists used</strong> to make astrology mathematical',
          '<strong>How I met my husband using astrological relocation</strong> (true story!)',
        ])}
      </div>
    `)}
    ${createSignature()}
  `;

  const token = emailPreferencesManager.generateUnsubscribeToken(email);
  const html = createEmailContainer(content + createFooter(email, token));
  const text = htmlToPlainText(html);

  return { html, text };
}

export function getWelcomeSubject(firstName: string): string {
  return 'Welcome to AstroForYou - Your video is here!';
}
