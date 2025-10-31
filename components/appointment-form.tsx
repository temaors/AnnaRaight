'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AppointmentFormProps {
  onSuccess?: () => void;
  defaultDate?: string;
  defaultTime?: string;
}

export default function AppointmentForm({ 
  onSuccess, 
  defaultDate = new Date().toISOString().split('T')[0],
  defaultTime = '10:30'
}: AppointmentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentLevel: '',
    desiredLevel: '',
    currentIncome: '',
    decisionMaker: '',
    appointment_date: defaultDate,
    appointment_time: defaultTime,
    timezone: 'Europe/Moscow'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/appointment/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }
      
      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        setMessage('✅ Appointment successfully booked! Confirmation email sent.');
        
        setFormData({
          name: '',
          email: '',
          currentLevel: '',
          desiredLevel: '',
          currentIncome: '',
          decisionMaker: '',
          appointment_date: defaultDate,
          appointment_time: defaultTime,
          timezone: 'Europe/Moscow'
        });

        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage('❌ An error occurred while submitting the form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Enter Details</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          isSuccess 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
            Name *
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
            Email *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <button 
            type="button" 
            className="text-blue-600 hover:text-blue-700 text-sm font-medium bg-white border border-blue-600 rounded-md px-3 py-1.5 hover:bg-blue-50 transition-colors"
          >
            Add Guests
          </button>
        </div>

        <div>
          <Label htmlFor="currentLevel" className="block text-sm font-medium text-gray-900 mb-2">
            What&apos;s your current level of Astrology knowledge? *
          </Label>
          <textarea
            id="currentLevel"
            name="currentLevel"
            value={formData.currentLevel}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            rows={4}
            className="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <Label htmlFor="desiredLevel" className="block text-sm font-medium text-gray-900 mb-2">
            What&apos;s your desired level of Astrology knowledge? *
          </Label>
          <textarea
            id="desiredLevel"
            name="desiredLevel"
            value={formData.desiredLevel}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            rows={4}
            className="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <Label htmlFor="currentIncome" className="block text-sm font-medium text-gray-900 mb-2">
            What&apos;s your current income? *
          </Label>
          <Input
            id="currentIncome"
            name="currentIncome"
            type="text"
            value={formData.currentIncome}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <Label htmlFor="decisionMaker" className="block text-sm font-medium text-gray-900 mb-2">
            Are you the sole decision maker? *
          </Label>
          <Input
            id="decisionMaker"
            name="decisionMaker"
            type="text"
            value={formData.decisionMaker}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="pt-6">
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            By proceeding, you confirm that you have read and agree to{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">Calendly&apos;s Terms of Use</a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Notice</a>.
          </p>
          
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Scheduling Event...' : 'Schedule Event'}
          </Button>
        </div>
      </form>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <button className="text-blue-600 hover:text-blue-700 text-sm">
          Cookie settings
        </button>
        <button className="text-blue-600 hover:text-blue-700 text-sm">
          Report abuse
        </button>
      </div>
    </div>
  );
}