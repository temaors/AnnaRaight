'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Card } from '@/components/ui/card';

interface LeadCaptureFormProps {
  onSuccess?: (email: string, firstName: string) => void;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  sendVideoEmail?: boolean;
  videoUrl?: string;
}

export default function LeadCaptureForm({ 
  onSuccess,
  title = "🎥 Получите эксклюзивное видео",
  subtitle = "Введите ваши данные и получите доступ к видео на email",
  buttonText = "Получить видео",
  sendVideoEmail = true,
  videoUrl = "/v/watch"
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    email: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const requestData = {
        firstName: formData.firstName,
        email: formData.email,
        ...(sendVideoEmail && { videoUrl })
      };

      const response = await fetch('/api/lead/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }
      
      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        
        if (sendVideoEmail) {
          if (result.email_sent) {
            setMessage('✅ Thank you! Welcome email has been sent to your inbox. Please check your email for your video link.');
          } else {
            setMessage('✅ Thank you for registering! You can access the video below.');
            console.warn('Welcome email not sent:', result.email_result);
          }
        } else {
          setMessage('✅ Thank you! Your information has been saved.');
        }
        
        // Reset form
        setFormData({
          firstName: '',
          email: ''
        });

        if (onSuccess) {
          setTimeout(() => {
            onSuccess(formData.email, formData.firstName);
          }, 1500);
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
    <div className="p-2 md:p-6 max-w-full md:max-w-2xl ml-0 md:ml-4">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2">
          {title}
        </h2>
        <p className="text-gray-600">
          {subtitle}
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 text-center ${
          isSuccess 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-1 md:space-y-2">
        <div>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Your First Name..."
            required
            disabled={isSubmitting}
            className="w-full h-16 md:h-14 px-5 text-lg font-medium text-black bg-gray-100 border-2 border-gray-200 rounded-none focus:outline-none focus:border-purple-500 placeholder-gray-400"
          />
        </div>

        <div>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Your Email Address..."
            required
            disabled={isSubmitting}
            className="w-full h-16 md:h-14 px-5 text-lg font-medium text-black bg-gray-100 border-2 border-gray-200 rounded-none focus:outline-none focus:border-purple-500 placeholder-gray-400"
          />
        </div>

        <div style={{marginTop: '0.5rem'}}>
          <Button 
            type="submit" 
            className="w-full h-16 md:h-20 text-2xl md:text-2xl font-black md:font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-none md:rounded-lg transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Dispatch...' : buttonText}
          </Button>
        </div>
      </form>

    </div>
  );
}