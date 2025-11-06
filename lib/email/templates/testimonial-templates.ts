/**
 * Testimonial Email Templates
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

// Testimonial 1 Email - Irina's Story
export function generateTestimonial1Email(data: EmailTemplateData): {
  html: string;
  text: string;
  attachments?: Array<{ filename: string; path: string; cid: string }>;
} {
  const { email, firstName, schedulingUrl } = data;

  const content = `
    ${createHeader('🌙 Confusing horoscopes?', 'Read this…')}
    ${createContentSection(`
      <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>,</p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        <strong>Question</strong> — have you ever felt frustrated with astrology?
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        One astrologer says one thing, another says the opposite… One month your "lucky" period feels like anything but… And when you need real answers, the horoscope is just too vague to be useful.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; font-style: italic; color: #666;">
        It's like you're trapped in an endless cycle of hope → confusion → disappointment.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        All you really want is <strong>clarity</strong>. <strong>Predictability</strong>. <strong>Guidance you can actually trust</strong>.
      </p>

      <p style="font-size: 17px; line-height: 1.8; margin-bottom: 20px; font-weight: bold;">
        Is that too much to ask?
      </p>

      <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50; text-align: center;">
        <p style="font-size: 18px; font-weight: bold; margin: 0; color: #2e7d32;">
          The answer is NO — it's NOT too much.
        </p>
        <p style="font-size: 16px; margin: 10px 0 0 0; color: #2e7d32;">
          And it IS possible.
        </p>
      </div>

      <p style="font-size: 17px; line-height: 1.8; margin-bottom: 15px; font-weight: bold;">
        The formula is simple:
      </p>

      <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin: 10px 0; padding-left: 20px; position: relative;">
          <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">1.</span>
          A precise, scientific method (not guesswork)
        </p>
        <p style="font-size: 16px; margin: 10px 0; padding-left: 20px; position: relative;">
          <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">2.</span>
          A step-by-step system anyone can learn
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        That's exactly what happened to <strong>Irina</strong>, one of my students.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        She worked as a notary assistant, brand new to astrology. Within just 13 months of learning our Reality Management system, she became a certified practitioner.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Now she gives accurate, professional readings, helps dozens of clients transform their lives, and earns her full-time living through astrology — all while working from home.
      </p>

      <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #856404; text-align: center;">
          Her old confusion is gone. She has clarity, purpose, and freedom.
        </p>
      </div>

      <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <img src="cid:photo2" alt="Irina's Review" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px;">
        <p style="font-size: 16px; margin-bottom: 15px; font-weight: bold;">
          👉 You can see her review here
        </p>
        <a href="https://youtu.be/xHfOOQSTdCs" style="color: #FF6B35; font-weight: bold; font-size: 16px; text-decoration: none;">
          https://youtu.be/xHfOOQSTdCs
        </a>
      </div>

      <p style="font-size: 17px; line-height: 1.8; margin-bottom: 25px; font-weight: bold; text-align: center;">
        Now it's your turn. Stop guessing, stop doubting — start giving accurate readings that actually change lives.
      </p>

      ${createButton('👉 Book your call now', schedulingUrl!)}
    `)}
    ${createSignature()}
  `;

  const token = emailPreferencesManager.generateUnsubscribeToken(email);
  const html = createEmailContainer(content + createFooter(email, token));
  const text = htmlToPlainText(html);

  return {
    html,
    text,
    attachments: [
      {
        filename: 'photo2.png',
        path: process.cwd() + '/public/photo2.png',
        cid: 'photo2'
      }
    ]
  };
}

// Testimonial 2 Email - Julia's Story
export function generateTestimonial2Email(data: EmailTemplateData): {
  html: string;
  text: string;
  attachments?: Array<{ filename: string; path: string; cid: string }>;
} {
  const { email, firstName, schedulingUrl } = data;

  const content = `
    ${createHeader('🌙 Integrity in astrology', '= real healing')}
    ${createContentSection(`
      <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>,</p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        It doesn't matter how inspiring an astrology session sounds… <strong>If it doesn't create real change in people's lives.</strong>
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
        That's why at AstroForYou Academy, we focus on <strong>BOTH</strong>:
      </p>

      <div style="background: white; padding: 20px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin: 10px 0; padding-left: 25px; position: relative;">
          <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
          Accuracy and reliability
        </p>
        <p style="font-size: 16px; margin: 10px 0; padding-left: 25px; position: relative;">
          <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
          Integrity and true service
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Because for me, astrology isn't about selling illusions.
      </p>

      <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50; text-align: center;">
        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #2e7d32;">
          It's about helping people find clarity, hope, and transformation — backed by science.
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Take <strong>Julia</strong>, one of my students.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        She had a client with early-stage cancer who had completely lost hope. Nothing seemed to help.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        But Julia used the Reality Management method to create a recovery strategy based on his unique chart. And once he followed it… <strong>the cancer stopped progressing.</strong>
      </p>

      <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
        <p style="font-size: 16px; margin: 0; color: #856404;">
          It was incredible. Not just an accurate prediction — but a <strong>life-changing intervention</strong> that gave him back his hope for the future.
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
        And Julia? She realized she could truly change lives as an astrologer — with confidence, integrity, and a proven method.
      </p>

      <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin-bottom: 15px; font-weight: bold;">
          👉 You can see Julia's full story here:
        </p>

        <div style="margin: 20px 0;">
          <img src="cid:photo3" alt="Julia's Review Part 1" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 10px;">
        </div>

        <div style="margin: 20px 0;">
          <img src="cid:photo4" alt="Julia's Review Part 2" style="max-width: 100%; height: auto; border-radius: 8px;">
        </div>
      </div>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        And if Julia's story resonates with you… imagine what could happen if you followed the same path.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
        You don't need years of trial and error. You just need a proven system — and the right guidance.
      </p>

      <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #2196f3;">
        <p style="font-size: 16px; line-height: 1.8; margin: 0; color: #1976d2;">
          That's exactly what we'll talk about on a short call together. I'll answer your questions, show you how the Reality Management system works, and help you see if this is the right path for you.
        </p>
      </div>

      ${createButton('👉 Click here to book your call now', schedulingUrl!)}
    `)}
    ${createSignature()}
  `;

  const token = emailPreferencesManager.generateUnsubscribeToken(email);
  const html = createEmailContainer(content + createFooter(email, token));
  const text = htmlToPlainText(html);

  return {
    html,
    text,
    attachments: [
      {
        filename: 'photo3.png',
        path: process.cwd() + '/public/photo3.png',
        cid: 'photo3'
      },
      {
        filename: 'photo4.png',
        path: process.cwd() + '/public/photo4.png',
        cid: 'photo4'
      }
    ]
  };
}

// Testimonial 3 Email - Olga's Story
export function generateTestimonial3Email(data: EmailTemplateData): {
  html: string;
  text: string;
  attachments?: Array<{ filename: string; path: string; cid: string }>;
} {
  const { email, firstName, schedulingUrl } = data;

  const content = `
    ${createHeader('🌙 Copy your way to', `accurate readings, ${firstName}`)}
    ${createContentSection(`
      <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>,</p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Want to start giving accurate, professional readings?
      </p>

      <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50; text-align: center;">
        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #2e7d32;">
          Here's the secret…
        </p>
      </div>

      <p style="font-size: 17px; line-height: 1.8; margin-bottom: 25px; font-weight: bold; text-align: center;">
        Don't try to reinvent astrology — just copy what already works.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        That's exactly what <strong>Olga</strong> did.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        When she came to us, her main request was simple: "I want to find my purpose." She had already studied at another astrology school, but still felt lost — unsure of her direction, her strengths, and how to help others.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Inside the Reality Management system, Olga finally discovered clarity. She learned that every person can manage their reality almost without limits, as long as they understand how the past influences the present, and the present shapes the future.
      </p>

      <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin-bottom: 20px; font-weight: bold;">
          After completing just five courses, Olga can now:
        </p>

        <ul style="font-size: 15px; line-height: 1.7; padding-left: 0; list-style: none;">
          <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
            Confidently analyze natal charts
          </li>
          <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
            Identify strengths, weaknesses, and life lessons
          </li>
          <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
            Provide career and relationship guidance
          </li>
          <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
            Even determine compatibility for love or business partnerships
          </li>
        </ul>
      </div>

      <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
        <p style="font-size: 16px; margin: 0; color: #856404; font-style: italic;">
          Her words? "Now I know exactly who I am, what I want — and I don't need magical rituals for this. Astrology answered all my questions and even more."
        </p>
      </div>

      <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin-bottom: 15px; font-weight: bold;">
          👉 You can watch Olga's full testimonial here:
        </p>

        <a href="https://youtu.be/8GgbPhjEeIo" style="color: #FF6B35; font-weight: bold; font-size: 16px; text-decoration: none; display: block; margin-bottom: 20px;">
          https://youtu.be/8GgbPhjEeIo
        </a>

        <div style="margin: 20px 0;">
          <img src="cid:photo5" alt="Olga's Review" style="max-width: 100%; height: auto; border-radius: 8px;">
        </div>
      </div>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Olga stopped "floating in the clouds." She gained clarity, confidence, and purpose — and she's now part of the AstroForYou Academy team, helping others find the same transformation.
      </p>

      <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #2196f3;">
        <p style="font-size: 17px; line-height: 1.8; margin: 0; color: #1976d2; font-weight: bold; text-align: center;">
          And that's the power of Reality Management. No guesswork. No endless trial and error. Just a proven method that anyone can copy — and see real results.
        </p>
      </div>

      ${createButton('👉 Click here to book your call now', schedulingUrl!)}
    `)}
    ${createSignature()}
  `;

  const token = emailPreferencesManager.generateUnsubscribeToken(email);
  const html = createEmailContainer(content + createFooter(email, token));
  const text = htmlToPlainText(html);

  return {
    html,
    text,
    attachments: [
      {
        filename: 'photo5.png',
        path: process.cwd() + '/public/photo5.png',
        cid: 'photo5'
      }
    ]
  };
}

// Subject lines
export function getTestimonial1Subject(firstName: string): string {
  return `🌙 Confusing horoscopes? Read this…`;
}

export function getTestimonial2Subject(firstName: string): string {
  return `🌙 Integrity in astrology = real healing`;
}

export function getTestimonial3Subject(firstName: string): string {
  return `🌙 Copy your way to accurate readings, ${firstName}`;
}
