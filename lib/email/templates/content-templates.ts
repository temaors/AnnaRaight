/**
 * Content Email Templates
 */

import {
  createEmailContainer,
  createHeader,
  createContentSection,
  createButton,
  createBulletList,
  createSignature,
  createFooter,
  htmlToPlainText,
} from '../utils/html-builder';
import { emailPreferencesManager } from '@/lib/email-preferences';
import { EmailTemplateData } from '../core/types';

// Content 1 Email - The Missing Link
export function generateContent1Email(data: EmailTemplateData): { html: string; text: string } {
  const { email, firstName, videoUrl } = data;

  const content = `
    ${createHeader('🌌 My secret to', 'accurate predictions')}
    ${createContentSection(`
      <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>,</p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Want to know the real secret behind astrology that actually works?
      </p>

      <div style="background: white; padding: 20px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin: 10px 0; text-align: center; color: #666;">
          It's not memorizing symbols…<br>
          It's not intuition…<br>
          And it's not reading generic horoscopes.
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        It's a simple "tweak" in how you approach astrology —
      </p>

      <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107; text-align: center;">
        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #856404;">
          one that instantly makes your readings more accurate, reliable, and life-changing.
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 15px; font-weight: bold;">
        So you can finally:
      </p>

      <ul style="font-size: 15px; line-height: 1.7; padding-left: 0; list-style: none; margin-bottom: 25px;">
        <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
          <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
          Give clients clarity instead of confusion
        </li>
        <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
          <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
          Predict events with confidence
        </li>
        <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
          <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
          And use astrology to create real transformation in their lives (and yours)
        </li>
      </ul>

      <p style="font-size: 17px; line-height: 1.8; margin-bottom: 20px; font-weight: bold;">
        So what is this secret?
      </p>

      <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50; text-align: center;">
        <p style="font-size: 18px; font-weight: bold; margin: 0; color: #2e7d32;">
          I call it "the missing link in astrology."
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 15px;">
        And, honestly…
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        It's not so much a secret as it is a law of the cosmos.
      </p>

      <div style="background: #f8d7da; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #dc3545;">
        <p style="font-size: 16px; margin: 0; color: #721c24;">
          Because if you ignore it…<br>
          <strong>Your predictions will always feel inconsistent, even random.</strong>
        </p>
      </div>

      <div style="background: #d1ecf1; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #17a2b8;">
        <p style="font-size: 16px; margin: 0; color: #0c5460;">
          But when you follow it…<br>
          <strong>Astrology becomes scientific, precise, and shockingly accurate.</strong>
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
        I've put together a short video where I explain exactly what this "missing link" is — and how you can apply it right now, even if you're new to astrology.
      </p>

      <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        ${createButton('👉 Click here to watch the video', videoUrl!)}

        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #6c757d;">
          <p style="font-size: 14px; color: #6c757d; margin: 0; font-style: italic;">
            [SCREENSHOT OF VIDEO]<br>
            <em>Video preview will be displayed here</em>
          </p>
        </div>
      </div>
    `)}
    ${createSignature()}
  `;

  const token = emailPreferencesManager.generateUnsubscribeToken(email);
  const html = createEmailContainer(content + createFooter(email, token));
  const text = htmlToPlainText(html);

  return { html, text };
}

// Content 2 Email - Step-by-step Tutorial
export function generateContent2Email(data: EmailTemplateData): { html: string; text: string } {
  const { email, firstName, videoUrl } = data;

  const content = `
    ${createHeader('🌌 [VIDEO] Step-by-step', 'astrology tutorial')}
    ${createContentSection(`
      <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>,</p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        I've just put together a short video that shows you step-by-step how to start giving accurate, reliable readings using the Reality Management method.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
        In the video, I pull back the curtain on everything…
      </p>

      <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <ul style="font-size: 15px; line-height: 1.7; padding-left: 0; list-style: none; margin: 0;">
          <li style="margin-bottom: 15px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
            The core formulas that make astrology scientific
          </li>
          <li style="margin-bottom: 15px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
            How to apply them to real charts (even as a beginner)
          </li>
          <li style="margin-bottom: 15px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
            How to avoid the #1 mistake that makes most predictions fail
          </li>
          <li style="margin-bottom: 15px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
            And how to start giving readings that truly transform lives
          </li>
        </ul>
      </div>

      <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50; text-align: center;">
        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #2e7d32;">
          All step by step.
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        If you can spare a few minutes to watch it, I guarantee it will help you:
      </p>

      <div style="background: white; padding: 20px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin: 10px 0; padding-left: 25px; position: relative;">
          <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">#1</span>
          understand astrology in a way that finally makes sense
        </p>
        <p style="font-size: 16px; margin: 10px 0; padding-left: 25px; position: relative;">
          <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">#2</span>
          start using it to make better decisions (and help others too)
        </p>
      </div>

      <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        ${createButton('👉 Click here to watch the video now', videoUrl!)}

        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #6c757d;">
          <p style="font-size: 14px; color: #6c757d; margin: 0; font-style: italic;">
            [SCREENSHOT OF VIDEO]<br>
            <em>Step-by-step tutorial preview</em>
          </p>
        </div>
      </div>
    `)}
    ${createSignature()}
  `;

  const token = emailPreferencesManager.generateUnsubscribeToken(email);
  const html = createEmailContainer(content + createFooter(email, token));
  const text = htmlToPlainText(html);

  return { html, text };
}

// Subject lines
export function getContent1Subject(firstName: string): string {
  return `🌌 My secret to accurate predictions`;
}

export function getContent2Subject(firstName: string): string {
  return `🌌 [VIDEO] Step-by-step astrology tutorial`;
}
