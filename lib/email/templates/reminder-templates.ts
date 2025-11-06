/**
 * Video Reminder Email Templates
 */

import {
  createEmailContainer,
  createHeader,
  createContentSection,
  createButton,
  createGreeting,
  createSignature,
  createFooter,
  htmlToPlainText,
} from '../utils/html-builder';
import { emailPreferencesManager } from '@/lib/email-preferences';
import { EmailTemplateData } from '../core/types';

// Video Reminder Email
export function generateVideoReminderEmail(data: EmailTemplateData): { html: string; text: string } {
  const { email, firstName, videoUrl } = data;

  const content = `
    ${createHeader('🌙 Quick Reminder', 'Your cosmic training awaits')}
    ${createContentSection(`
      ${createGreeting(firstName!)}

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Just a quick reminder — your training video is ready for you:
      </p>

      <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        ${createButton('🎬 Watch Now', videoUrl!)}
      </div>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        This training reveals the Reality Management method that 400+ practitioners are using to earn $5,000-$15,000/month from home.
      </p>
    `)}
    ${createSignature()}
  `;

  const token = emailPreferencesManager.generateUnsubscribeToken(email);
  const html = createEmailContainer(content + createFooter(email, token));
  const text = htmlToPlainText(html);

  return { html, text };
}

// Checking-in Email
export function generateCheckingInEmail(data: EmailTemplateData): { html: string; text: string } {
  const { email, firstName, videoUrl, schedulingUrl } = data;

  const content = `
    ${createHeader('🌙 Did the video resonate with you?', 'Let\'s chat about what you learned')}
    ${createContentSection(`
      <p style="font-size: 18px; margin-bottom: 20px;">Hi <strong>${firstName}</strong> — it's Vladimir here.</p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Anna asked me to check in personally and see if you had any questions about the video on scientific astrology and the Reality Management method.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Many people say it's the first time astrology has ever actually made sense for them — I'd love to hear what resonated with you most.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
        If you'd like, we can also set aside a few minutes to chat. I'll answer your questions directly and show you how you can start giving accurate, professional readings yourself.
      </p>

      ${createButton('👉 Book a quick call with me here', schedulingUrl!)}

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Would today or tomorrow work better for you?
      </p>

      <p style="font-size: 16px; margin-bottom: 15px;">
        Cosmically yours,<br>
        <strong>Vladimir 🌙</strong>
      </p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
        <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
          <strong>P.S.</strong> Here's the link again in case you missed it:
        </p>
        <div style="text-align: center;">
          <a href="${schedulingUrl}" style="display: inline-block; background: linear-gradient(135deg, #6A1B9A 0%, #4A148C 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px;">
            Book your call here
          </a>
        </div>
      </div>
    `)}
  `;

  const token = emailPreferencesManager.generateUnsubscribeToken(email);
  const html = createEmailContainer(content + createFooter(email, token));
  const text = htmlToPlainText(html);

  return { html, text };
}

// Direct Offer Email - "Accurate readings" (Long-form sales email)
export function generateDirectOfferEmail(data: EmailTemplateData): { html: string; text: string } {
  const { email, firstName, schedulingUrl } = data;

  const content = `
    ${createHeader('✨ Accurate readings', '(copy & paste the method)')}
    ${createContentSection(`
      <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>,</p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        <strong>Want to give accurate, professional readings — without guessing or vague "horoscope talk"?</strong> Then keep reading…
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        I'll share the exact Reality Management formula — a mathematically structured approach developed by Russian scientist Dr. Sergey Shestopalov and his research team. It's been tested on <strong>23,281 charts</strong>, clinical archives, aerospace data, and even marriage registries… and it works with stunning precision.
      </p>

      <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #856404;">
          All you have to do is copy & paste the formulas into your practice (or daily life).
        </p>
      </div>

      <p style="font-size: 18px; font-weight: bold; text-align: center; margin: 30px 0; color: #d32f2f;">
        And if you don't start giving accurate readings within 7 months…<br>
        YOU DON'T PAY.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Keep reading below and I'll show you…<br>
        <strong>#1</strong> - How this works<br>
        <strong>#2</strong> - Proof that it works
      </p>

      <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <h3 style="color: #2D1B69; margin-top: 0;">First off, how it works…</h3>

        <p style="font-size: 16px; line-height: 1.8; margin-bottom: 15px;">
          Traditional astrology often feels vague and contradictory. One astrologer says one thing, another — the opposite. It's subjective, not scientific.
        </p>

        <p style="font-size: 16px; line-height: 1.8; margin-bottom: 15px;">
          <strong>Dr. Shestopalov's method is completely different.</strong> It's a mathematically formalized, statistically proven system called the Formula of Events. By spotting recurring planetary patterns, you can predict future events before they happen — reliably and consistently.
        </p>

        <p style="font-size: 16px; line-height: 1.8; margin-bottom: 0;">
          And it's not just theory: this system has been honored by the European Medical Association, the Medical Royal Society of Belgium, and presented at the World Scientific Congress at the UN in Geneva.
        </p>
      </div>

      <h3 style="color: #2D1B69; margin-top: 30px;">I've seen it over and over and over again…</h3>

      <ul style="font-size: 16px; line-height: 1.8;">
        <li style="margin-bottom: 15px;"><strong>Julia</strong>, one of my students, used the method to give a recovery roadmap to a client with early-stage cancer. The progression stopped, and he found hope again.</li>
        <li style="margin-bottom: 15px;"><strong>Lera</strong>, a seamstress with no astrology background, became a certified practitioner in just months — today she earns her full-time living giving readings.</li>
        <li style="margin-bottom: 15px;"><strong>Uliana</strong>, a complete beginner, now delivers premium forecasts at $250 each.</li>
        <li style="margin-bottom: 15px;"><strong>Olga</strong>, a busy mom, studied during her toddler's naps — and within 4 months built a $1,000/month side income helping clients understand themselves.</li>
        <li style="margin-bottom: 15px;"><strong>My own story</strong>: I used this method to relocate — which led to a career breakthrough in Los Angeles, and later, to meeting my husband in Australia.</li>
      </ul>

      <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50;">
        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #2e7d32;">
          Bottom line: it works. And it works consistently.
        </p>
      </div>

      <p style="font-size: 17px; line-height: 1.8; margin-bottom: 25px; text-align: center; font-weight: 500;">
        That's why I can confidently say: if you don't start giving accurate readings and seeing clear results within 7 months, you don't pay.
      </p>

      ${createButton('👉 Click here and book a call', schedulingUrl!)}

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 15px; text-align: center;">
        There's no pressure. If it's not for you, we won't waste your time.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px; text-align: center;">
        But if you're ready to finally see how astrology really works — this is your moment.
      </p>

      <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: center;">
        Sounds good?
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px; text-align: center;">
        Then <a href="${schedulingUrl}" style="color: #FF6B35; font-weight: bold;">click this link here</a> and book a call on the next page.
      </p>
    `)}
    ${createSignature()}
  `;

  const token = emailPreferencesManager.generateUnsubscribeToken(email);
  const html = createEmailContainer(content + createFooter(email, token));
  const text = htmlToPlainText(html);

  return { html, text };
}

// Final Reminder Email (with Uliana's testimonial)
export function generateFinalReminderEmail(data: EmailTemplateData): {
  html: string;
  text: string;
  attachments?: Array<{ filename: string; path: string; cid: string }>;
} {
  const { email, firstName, schedulingUrl } = data;

  const content = `
    ${createHeader('🌙 LAST REMINDER', 'Read if you want accurate readings')}
    ${createContentSection(`
      <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>, it's Anna again :)</p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Just wanted to bump this one last time to make sure you've seen the offer.
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        The original review is copied below. I'd also recommend you check out what my student Uliana achieved after becoming a certified practitioner. She went from working as an accountant to building a full-time astrology practice in just a year — helping clients transform their lives while working from home.
      </p>

      <div style="background: white; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin-bottom: 15px; font-weight: bold;">👉 You can read her review here:</p>
        <img src="cid:photo1" alt="Uliana's Review" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">
      </div>

      <p style="font-size: 16px; margin-bottom: 25px; text-align: center;">
        Talk soon,<br>
        <strong>Anna 🌙</strong>
      </p>

      <div style="border-top: 2px solid #e9ecef; margin: 30px 0; padding-top: 25px;">
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h3 style="color: #2D1B69; margin-top: 0; font-size: 20px;">Want to give accurate, professional readings? Then keep reading…</h3>

          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 15px;">
            We'll share with you the exact Reality Management system — a scientifically recognized, mathematically proven method of predictive astrology.
          </p>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="font-size: 16px; font-weight: bold; margin: 0; color: #856404;">
              All you have to do is copy & paste the formulas into your practice.
            </p>
          </div>

          <p style="font-size: 17px; font-weight: bold; text-align: center; margin: 25px 0; color: #d32f2f;">
            And if you don't start giving accurate readings within 7 months…<br>
            YOU DON'T PAY.
          </p>

          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Here's what you'll see inside:<br>
            <strong>#1</strong> — How it works<br>
            <strong>#2</strong> — Proof that it works
          </p>

          <h4 style="color: #2D1B69; margin-top: 25px;">How it works</h4>

          <p style="font-size: 15px; line-height: 1.8; margin-bottom: 15px;">
            For over 20 years, Russian mathematician and astrologer Dr. Sergey Shestopalov refined this method using 23,281 birth charts, clinical archives, aerospace performance data, and even marriage registries.
          </p>

          <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px;">
            The result is a mathematical model of astrology — not guesswork, not vague symbolism. It predicts life events with stunning accuracy, and it's the only system in the world recognized by the international scientific community.
          </p>

          <h4 style="color: #2D1B69; margin-top: 25px;">Proof that it works…</h4>

          <ul style="font-size: 15px; line-height: 1.7; padding-left: 20px;">
            <li style="margin-bottom: 10px;"><strong>Julia:</strong> helped a client with early-stage cancer create a recovery strategy — the progression stopped.</li>
            <li style="margin-bottom: 10px;"><strong>Uliana:</strong> a total beginner, now delivers $250 premium forecasts after certification.</li>
            <li style="margin-bottom: 10px;"><strong>Olga:</strong> busy mom, built a $1,000/month side income in 4 months while studying during toddler naps.</li>
            <li style="margin-bottom: 10px;"><strong>My story:</strong> using this system, I relocated to Los Angeles (career breakthrough) and later to Australia (where I met my husband).</li>
          </ul>

          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p style="font-size: 16px; font-weight: bold; margin: 0; color: #2e7d32; text-align: center;">
              Bottom line: it works.
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px; text-align: center;">
            That's why I can confidently say: if you don't start giving accurate readings and getting results in your life within 7 months — you don't pay.
          </p>

          <p style="font-size: 17px; font-weight: bold; margin-bottom: 20px; text-align: center;">
            Sounds good?
          </p>

          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px; text-align: center;">
            So if you want more info on how this all works…
          </p>

          ${createButton('👉 Click here and book a call', schedulingUrl!)}

          <p style="font-size: 15px; line-height: 1.8; margin-bottom: 0; text-align: center; color: #666;">
            No pressure. If it's not right for you, we won't waste your time. But if you're ready to finally see how astrology really works… this is your moment.
          </p>
        </div>
      </div>

      <p style="font-size: 16px; margin-bottom: 0; margin-top: 30px;">
        Cosmically yours,<br>
        <strong>Anna Raight 🌙</strong><br>
        <em>Founder, AstroForYou Academy</em>
      </p>
    `)}
  `;

  const token = emailPreferencesManager.generateUnsubscribeToken(email);
  const html = createEmailContainer(content + createFooter(email, token));
  const text = htmlToPlainText(html);

  return {
    html,
    text,
    attachments: [
      {
        filename: 'photo1.png',
        path: process.cwd() + '/public/photo1.png',
        cid: 'photo1'
      }
    ]
  };
}

// Subject lines
export function getVideoReminderSubject(firstName: string): string {
  return `Don't miss your cosmic training, ${firstName}`;
}

export function getCheckingInSubject(firstName: string): string {
  return `Did the video resonate with you?`;
}

export function getDirectOfferSubject(firstName: string): string {
  return `✨ Accurate readings (copy & paste the method)`;
}

export function getFinalReminderSubject(firstName: string): string {
  return `🌙 LAST REMINDER: Read if you want accurate readings`;
}
