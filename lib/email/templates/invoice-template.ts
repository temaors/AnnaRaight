/**
 * Invoice Email Template
 */

import { InvoiceData } from '../core/types';
import { emailPreferencesManager } from '@/lib/email-preferences';

export function generateInvoiceEmail(invoiceData: InvoiceData): { html: string; subject: string } {
  const formattedDueDate = invoiceData.due_date
    ? new Date(invoiceData.due_date).toLocaleDateString('ru-RU')
    : null;

  let htmlContent = `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">💰 Счет к оплате</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Привет${invoiceData.name ? `, ${invoiceData.name}` : ''}! Вам выставлен счет</p>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                <h2 style="color: #2d5a2d; margin-top: 0;">📋 Детали счета</h2>

                <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>📄 Номер счета:</strong> ${invoiceData.invoice_number}</p>
                    <p><strong>💰 Сумма к оплате:</strong> ${invoiceData.total_amount.toFixed(2)} ${invoiceData.currency}</p>
                    ${formattedDueDate ? `<p><strong>📅 Срок оплаты:</strong> ${formattedDueDate}</p>` : ''}
                    <p><strong>📧 Email:</strong> ${invoiceData.email}</p>
                </div>

                ${invoiceData.image_url ? `
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center;">
                    <p style="color: #666; margin-bottom: 10px;">📸 Изображение товара/услуги:</p>
                    <img src="${process.env.NEXT_PUBLIC_BASE_URL}${invoiceData.image_url}"
                         alt="Invoice image"
                         style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: block; margin: 0 auto;" />
                    <p style="color: #999; font-size: 12px; margin-top: 10px;">
                        Если изображение не отображается, <a href="${process.env.NEXT_PUBLIC_BASE_URL}${invoiceData.image_url}" style="color: #667eea;">нажмите здесь</a>
                    </p>
                </div>
                ` : ''}

                <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
                    <h3 style="color: #2d5a2d; margin-top: 0;">🛍️ Что включено:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <th style="text-align: left; padding: 8px;">Описание</th>
                                <th style="text-align: center; padding: 8px;">Кол-во</th>
                                <th style="text-align: right; padding: 8px;">Цена</th>
                                <th style="text-align: right; padding: 8px;">Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
  `;

  // Add invoice items
  invoiceData.items.forEach(item => {
    htmlContent += `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 8px;">${item.description}</td>
                                <td style="text-align: center; padding: 8px;">${item.quantity}</td>
                                <td style="text-align: right; padding: 8px;">${item.unit_price.toFixed(2)} ${invoiceData.currency}</td>
                                <td style="text-align: right; padding: 8px; font-weight: bold;">${item.total_price.toFixed(2)} ${invoiceData.currency}</td>
                            </tr>
    `;
  });

  htmlContent += `
                        </tbody>
                        <tfoot>
                            <tr style="border-top: 2px solid #2d5a2d; font-weight: bold;">
                                <td colspan="3" style="text-align: right; padding: 12px;">ИТОГО:</td>
                                <td style="text-align: right; padding: 12px; font-size: 18px;">${invoiceData.total_amount.toFixed(2)} ${invoiceData.currency}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                ${invoiceData.notes ? `
                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 15px 0;">
                    <h3 style="color: #856404; margin-top: 0;">📝 Дополнительные заметки:</h3>
                    <p style="margin: 0;">${invoiceData.notes}</p>
                </div>
                ` : ''}

                ${invoiceData.post_payment_content_enabled && invoiceData.post_payment_content ? `
                <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #c3e6cb;">
                    <h3 style="color: #155724; margin-top: 0;">🎁 Что вы получите после оплаты:</h3>
                    <p style="color: #155724; margin: 0; white-space: pre-line;">${invoiceData.post_payment_content}</p>
                </div>
                ` : ''}

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${invoiceData.invoice_url}" style="display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        💳 Оплатить счет онлайн
                    </a>
                </div>

                <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #0c5460; margin-top: 0;">ℹ️ Как оплатить:</h3>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #0c5460;">
                        <li>Нажмите кнопку "Оплатить счет онлайн"</li>
                        <li>Введите данные банковской карты</li>
                        <li>Подтвердите платеж</li>
                        <li>Получите подтверждение об оплате</li>
                    </ul>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                <p>С уважением,<br>Команда AstroForYou</p>
            </div>
        </div>
    </body>
    </html>
  `;

  // Add unsubscribe footer
  htmlContent = emailPreferencesManager.addUnsubscribeFooter(htmlContent, invoiceData.email);

  const subject = `💰 Счет ${invoiceData.invoice_number} к оплате - ${invoiceData.total_amount.toFixed(2)} ${invoiceData.currency}`;

  return { html: htmlContent, subject };
}
