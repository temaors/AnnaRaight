'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';

interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  lead_id: number;
  email: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  total_amount: number;
  currency: string;
  due_date?: string;
  invoice_date: string;
  notes?: string;
  sent_at?: string;
  viewed_at?: string;
  paid_at?: string;
  lead_name?: string;
  items: InvoiceItem[];
}

interface InvoiceStats {
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'paid'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Create form state
  const [createForm, setCreateForm] = useState({
    lead_id: '',
    email: '',
    due_date: '',
    notes: '',
    currency: 'USD',
    items: [{ description: '', quantity: 1, unit_price: 0 }],
    // New fields for images and content
    image_url: '',
    image_filename: '',
    post_payment_content: '',
    post_payment_content_enabled: false,
    digital_content: [] as Array<{
      content_type: 'file' | 'link' | 'text' | 'course_access';
      title: string;
      description: string;
      content_url: string;
      filename: string;
      access_instructions: string;
      is_downloadable: boolean;
      download_limit: number;
      expiry_days: number;
    }>
  });
  
  // States for file uploads
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingContent, setUploadingContent] = useState(false);
  const [formTab, setFormTab] = useState<'basic' | 'image' | 'content'>('basic');

  const fetchInvoices = useCallback(async () => {
    try {
      const statusFilter = activeTab === 'all' ? '' : `?status=${activeTab}`;
      const response = await fetch(`/api/admin/invoices/list${statusFilter}`);
      const result = await response.json();
      
      if (result.success) {
        setInvoices(result.data.invoices);
        setStats(result.data.stats);
      } else {
        console.error('Error fetching invoices:', result.error);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📤 Отправка формы создания инвойса:', {
      has_image: !!createForm.image_url,
      image_url: createForm.image_url,
      image_filename: createForm.image_filename,
      content_enabled: createForm.post_payment_content_enabled,
      digital_content_count: createForm.digital_content.length
    });
    
    try {
      const response = await fetch('/api/admin/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateForm(false);
        setCreateForm({
          lead_id: '',
          email: '',
          due_date: '',
          notes: '',
          currency: 'USD',
          items: [{ description: '', quantity: 1, unit_price: 0 }],
          image_url: '',
          image_filename: '',
          post_payment_content: '',
          post_payment_content_enabled: false,
          digital_content: []
        });
        fetchInvoices();
        alert('Invoice created successfully!');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    }
  };

  const handleSendInvoice = async (invoiceId: number) => {
    try {
      const response = await fetch('/api/admin/invoices/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.checkout_url.includes('demo=true')) {
          alert(`✅ Инвойс отправлен в демо-режиме!\n\n⚠️ Stripe не настроен.\n\n📋 Ссылка для клиента:\n${result.checkout_url}\n\n📧 Email с инвойсом отправлен клиенту!\n\nДля реальных платежей настройте Stripe ключи в .env.local`);
        } else {
          alert('✅ Инвойс отправлен! Stripe checkout создан и email отправлен клиенту.');
        }
        fetchInvoices();
      } else {
        alert(`❌ Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('❌ Ошибка при отправке инвойса');
    }
  };

  const handleSendEmailOnly = async (invoiceId: number) => {
    try {
      const response = await fetch('/api/admin/invoices/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Email с инвойсом отправлен клиенту!');
      } else {
        alert(`❌ Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending invoice email:', error);
      alert('❌ Ошибка при отправке email');
    }
  };

  // Image upload function
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/invoices/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setCreateForm(prev => ({
          ...prev,
          image_url: result.data.file_url,
          image_filename: result.data.filename
        }));
        alert('✅ Изображение загружено успешно!');
      } else {
        alert(`❌ Ошибка загрузки: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('❌ Ошибка при загрузке изображения');
    } finally {
      setUploadingImage(false);
    }
  };

  // Content file upload function  
  const handleContentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingContent(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/invoices/upload-content', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Add to digital content array
        const newContent = {
          content_type: 'file' as const,
          title: result.data.original_filename,
          description: '',
          content_url: result.data.file_url,
          filename: result.data.filename,
          access_instructions: '',
          is_downloadable: true,
          download_limit: 0,
          expiry_days: 0
        };

        setCreateForm(prev => ({
          ...prev,
          digital_content: [...prev.digital_content, newContent]
        }));

        alert('✅ Файл контента загружен успешно!');
      } else {
        alert(`❌ Ошибка загрузки: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading content file:', error);
      alert('❌ Ошибка при загрузке файла контента');
    } finally {
      setUploadingContent(false);
    }
  };

  // Remove image
  const removeImage = () => {
    setCreateForm(prev => ({
      ...prev,
      image_url: '',
      image_filename: ''
    }));
  };

  // Remove digital content item
  const removeContentItem = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      digital_content: prev.digital_content.filter((_, i) => i !== index)
    }));
  };

  const addInvoiceItem = () => {
    setCreateForm(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const removeInvoiceItem = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setCreateForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const getTotalAmount = () => {
    return createForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:text-blue-200';
      case 'viewed': return 'bg-yellow-100 text-yellow-800 dark:text-yellow-200';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка инвойсов...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💰 Управление инвойсами</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Создание и отправка инвойсов клиентам
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ➕ Создать инвойс
              </button>
              <a 
                href="/admin/test-invoice-image" 
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                🖼️ Тест изображений
              </a>
              <a 
                href="/admin/leads" 
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                📊 Лиды
              </a>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.totalInvoices}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Всего инвойсов</div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Общий доход</div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">{stats.paidInvoices}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Оплачено</div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-300">{stats.pendingInvoices}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">В ожидании</div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.overdueInvoices}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Просрочено</div>
              </div>
            </Card>
          </div>
        )}

        {/* Create Invoice Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">💰 Создать новый инвойс</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              {/* Form Tabs */}
              <div className="mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8">
                    {[
                      { key: 'basic', label: '📋 Основное', icon: '📋' },
                      { key: 'image', label: '🖼️ Изображение', icon: '🖼️' },
                      { key: 'content', label: '📦 Контент после оплаты', icon: '📦' },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setFormTab(tab.key as 'basic' | 'image' | 'content')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          formTab === tab.key
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
              
              <form onSubmit={handleCreateInvoice} className="space-y-6">
                {/* Basic Information Tab */}
                {formTab === 'basic' && (
                  <>
                    {/* Client Information */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">👤 Информация о клиенте</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                        🆔 Lead ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={createForm.lead_id}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, lead_id: e.target.value }))}
                        className="w-full p-3 border-2 border-blue-200 dark:border-blue-700 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Например: 1"
                        required
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">ID клиента из таблицы лидов</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                        📧 Email адрес <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-3 border-2 border-blue-200 dark:border-blue-700 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="client@example.com"
                        required
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">Email для отправки инвойса</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Settings */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">⚙️ Настройки инвойса</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        📅 Срок оплаты
                      </label>
                      <input
                        type="date"
                        value={createForm.due_date}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, due_date: e.target.value }))}
                        className="w-full p-3 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg focus:border-yellow-500 dark:focus:border-yellow-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">Дата до которой нужно оплатить</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        💱 Валюта
                      </label>
                      <select
                        value={createForm.currency}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full p-3 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg focus:border-yellow-500 dark:focus:border-yellow-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="USD">🇺🇸 USD (Доллары США)</option>
                        <option value="EUR">🇪🇺 EUR (Евро)</option>
                        <option value="RUB">🇷🇺 RUB (Российские рубли)</option>
                      </select>
                      <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">Валюта для оплаты</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      📝 Заметки (необязательно)
                    </label>
                    <textarea
                      value={createForm.notes}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-3 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg focus:border-yellow-500 dark:focus:border-yellow-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Дополнительная информация для клиента..."
                    />
                    <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">Эти заметки будут видны клиенту в инвойсе</p>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">🛍️ Товары и услуги</h3>
                    <button
                      type="button"
                      onClick={addInvoiceItem}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      ➕ Добавить позицию
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {createForm.items.map((item, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border-2 border-green-200">
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-5">
                            <label className="block text-xs font-medium text-green-800 mb-1">
                              Описание товара/услуги
                            </label>
                            <input
                              type="text"
                              placeholder="Например: Консультация по маркетингу"
                              value={item.description}
                              onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                              className="w-full p-2 border border-green-300 rounded-md focus:border-green-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              required
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-green-800 mb-1">
                              Количество
                            </label>
                            <input
                              type="number"
                              placeholder="1"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full p-2 border border-green-300 rounded-md focus:border-green-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              min="1"
                              required
                            />
                          </div>
                          
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-green-800 mb-1">
                              Цена за единицу
                            </label>
                            <input
                              type="number"
                              placeholder="100.00"
                              value={item.unit_price}
                              onChange={(e) => updateInvoiceItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full p-2 border border-green-300 rounded-md focus:border-green-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                          
                          <div className="col-span-1 text-center">
                            <label className="block text-xs font-medium text-green-800 mb-1">
                              Сумма
                            </label>
                            <div className="text-lg font-semibold text-green-700">
                              ${(item.quantity * item.unit_price).toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="col-span-1 text-center">
                            {createForm.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeInvoiceItem(index)}
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100"
                                title="Удалить позицию"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 bg-white p-4 rounded-lg border-2 border-green-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-green-900">
                        🧮 Общая сумма к оплате:
                      </span>
                      <span className="text-2xl font-bold text-green-700">
                        ${getTotalAmount().toFixed(2)} {createForm.currency}
                      </span>
                    </div>
                  </div>
                </div>
                  </>
                )}

                {/* Image Upload Tab */}
                {formTab === 'image' && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-4">🖼️ Изображение для инвойса</h3>
                    
                    {createForm.image_url ? (
                      <div className="mb-4">
                        <div className="relative inline-block">
                          <img 
                            src={createForm.image_url} 
                            alt="Invoice image" 
                            className="max-w-md max-h-64 rounded-lg shadow-md"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                          📁 Файл: {createForm.image_filename}
                        </p>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-amber-300 rounded-lg p-8 text-center">
                        <div className="text-4xl mb-4">🖼️</div>
                        <p className="text-amber-800 dark:text-amber-200 mb-4">
                          Перетащите изображение сюда или нажмите для выбора
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                          disabled={uploadingImage}
                        />
                        <label
                          htmlFor="image-upload"
                          className={`inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer transition-colors ${
                            uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {uploadingImage ? '⏰ Загрузка...' : '📤 Выбрать изображение'}
                        </label>
                        <p className="text-xs text-amber-600 dark:text-amber-300 mt-2">
                          Поддерживаются: JPG, PNG, GIF, WebP (макс. 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Post-Payment Content Tab */}
                {formTab === 'content' && (
                  <div className="bg-green-50 p-6 rounded-lg space-y-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">📦 Контент после оплаты</h3>
                    
                    {/* Enable content toggle */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="content-enabled"
                        checked={createForm.post_payment_content_enabled}
                        onChange={(e) => setCreateForm(prev => ({ 
                          ...prev, 
                          post_payment_content_enabled: e.target.checked 
                        }))}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="content-enabled" className="text-sm font-medium text-green-800">
                        ✅ Включить контент после оплаты
                      </label>
                    </div>

                    {createForm.post_payment_content_enabled && (
                      <>
                        {/* Text content */}
                        <div>
                          <label className="block text-sm font-medium text-green-800 mb-2">
                            📝 Текстовое сообщение клиенту
                          </label>
                          <textarea
                            value={createForm.post_payment_content}
                            onChange={(e) => setCreateForm(prev => ({ 
                              ...prev, 
                              post_payment_content: e.target.value 
                            }))}
                            className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            rows={4}
                            placeholder="Спасибо за оплату! Вот ваши материалы..."
                          />
                        </div>

                        {/* File uploads */}
                        <div>
                          <label className="block text-sm font-medium text-green-800 mb-2">
                            📁 Файлы для скачивания
                          </label>
                          
                          {/* Upload new file */}
                          <div className="border-2 border-dashed border-green-300 rounded-lg p-4 text-center mb-4">
                            <input
                              type="file"
                              onChange={handleContentUpload}
                              className="hidden"
                              id="content-upload"
                              disabled={uploadingContent}
                            />
                            <label
                              htmlFor="content-upload"
                              className={`inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors ${
                                uploadingContent ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {uploadingContent ? '⏰ Загрузка...' : '📤 Добавить файл'}
                            </label>
                            <p className="text-xs text-green-600 mt-2">
                              PDF, ZIP, DOC, XLS, MP4, MP3 и др. (макс. 100MB)
                            </p>
                          </div>

                          {/* Uploaded files list */}
                          {createForm.digital_content.length > 0 && (
                            <div className="space-y-2">
                              {createForm.digital_content.map((item, index) => (
                                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-2xl">📎</span>
                                    <div>
                                      <p className="font-medium text-green-900">{item.title}</p>
                                      <p className="text-xs text-green-600">
                                        {item.content_type === 'file' ? 'Файл для скачивания' : 'Ссылка'}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeContentItem(index)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6 border-t">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-semibold text-lg transition-colors"
                  >
                    ✅ Создать инвойс
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-400 text-white py-3 px-6 rounded-lg hover:bg-gray-500 font-semibold text-lg transition-colors"
                  >
                    ❌ Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {[
                { key: 'all', label: 'Все', count: stats?.totalInvoices || 0 },
                { key: 'draft', label: 'Черновики', count: 0 },
                { key: 'sent', label: 'Отправлены', count: stats?.pendingInvoices || 0 },
                { key: 'paid', label: 'Оплачены', count: stats?.paidInvoices || 0 },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'all' | 'draft' | 'sent' | 'paid')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Invoices Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Номер</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Клиент</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Сумма</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{invoice.lead_name || 'Unknown'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{invoice.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      ${invoice.total_amount.toFixed(2)} {invoice.currency}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(invoice.invoice_date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex space-x-2">
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => handleSendInvoice(invoice.id)}
                            className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:text-blue-200 text-xs"
                          >
                            📤 Отправить
                          </button>
                        )}
                        <button
                          onClick={() => handleSendEmailOnly(invoice.id)}
                          className="text-green-600 hover:text-green-800 text-xs"
                        >
                          📧 Email
                        </button>
                        <a
                          href={`/invoice/${invoice.invoice_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 text-xs"
                        >
                          👁️ Просмотр
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {invoices.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>Инвойсов пока нет</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}