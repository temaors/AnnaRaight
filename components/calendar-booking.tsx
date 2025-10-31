'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface CalendarBookingProps {
  onSuccess?: (data: { date: string; time: string }) => void;
}

export default function CalendarBooking({ onSuccess }: CalendarBookingProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Available dates (next 7 days from today)
  const today = new Date();
  const availableDates = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1));
  
  // Keep track of dates with available slots
  const [datesWithSlots, setDatesWithSlots] = useState<Map<string, boolean>>(new Map());
  const pendingRequests = useRef<Set<string>>(new Set());

  // Generate full day time slots (00:00 to 23:30 with 30-minute intervals)
  const generateFullDaySlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };


  // Pre-check which dates have available slots (lazy loading with debounce)
  const checkDateAvailability = useCallback(async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Don't check if already checked or request is pending
    if (datesWithSlots.has(dateStr) || pendingRequests.current.has(dateStr)) {
      return;
    }
    
    pendingRequests.current.add(dateStr);
    
    try {
      const response = await fetch(`/api/google-calendar/available-slots/${dateStr}`);
      const data = await response.json();
      
      const hasSlots = data.success && data.available_slots && data.available_slots.length > 0;
      setDatesWithSlots(prev => new Map(prev).set(dateStr, hasSlots));
    } catch (error) {
      console.error(`Error checking availability for ${dateStr}:`, error);
      // Assume available on error
      setDatesWithSlots(prev => new Map(prev).set(dateStr, true));
    } finally {
      pendingRequests.current.delete(dateStr);
    }
  }, [datesWithSlots]);

  useEffect(() => {
    setMounted(true);
    // Only check today and next day initially
    if (availableDates.length > 0) {
      checkDateAvailability(availableDates[0]);
      if (availableDates.length > 1) {
        checkDateAvailability(availableDates[1]);
      }
    }
  }, []);

  // Available time slots from Google Calendar integration
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch available time slots when a date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      console.log(`🔄 Fetching slots for ${dateStr}...`);
      const response = await fetch(`/api/google-calendar/available-slots/${dateStr}?t=${Date.now()}`);
      const data = await response.json();
      console.log(`📦 Raw API response:`, data);
      
      if (data.success && data.available_slots) {
        console.log(`✅ API returned ${data.available_slots.length} slots, last slot: ${data.available_slots[data.available_slots.length - 1]}`);
        setTimeSlots(data.available_slots);
      } else {
        // Fallback to default time slots - full day
        console.log('📅 Using fallback calendar slots, generating all slots...');
        const allSlots = generateFullDaySlots();
        console.log(`🕐 Generated ${allSlots.length} slots, last slot: ${allSlots[allSlots.length - 1]}`);
        setTimeSlots(allSlots);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      // Fallback to default time slots - full day
      console.log('⚠️ Error fallback: generating all slots...');
      const errorSlots = generateFullDaySlots();
      console.log(`🕐 Error fallback generated ${errorSlots.length} slots, last slot: ${errorSlots[errorSlots.length - 1]}`);
      setTimeSlots(errorSlots);
    } finally {
      setLoadingSlots(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add days from previous month to fill the grid
  const startDay = monthStart.getDay();
  const previousMonthDays = Array.from({ length: startDay }, (_, i) => 
    addDays(monthStart, -(startDay - i))
  );

  // Add days from next month to fill the grid
  const totalCells = 35; // 5 rows × 7 days
  const currentDays = previousMonthDays.length + monthDays.length;
  const nextMonthDaysCount = totalCells - currentDays;
  const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => 
    addDays(monthEnd, i + 1)
  );

  const allDays = [...previousMonthDays, ...monthDays, ...nextMonthDays];

  const isDateAvailable = (date: Date) => {
    const isInRange = availableDates.some(availableDate => isSameDay(date, availableDate));
    if (!isInRange) return false;
    
    // Check if this date has available slots
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasSlots = datesWithSlots.get(dateStr);
    
    // If we haven't checked yet, assume available
    return hasSlots !== false;
  };

  const handleDateSelect = async (date: Date) => {
    // Check availability before selecting
    await checkDateAvailability(date);
    
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      setSelectedTime(null);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNext = () => {
    if (!selectedDate || !selectedTime) return;
    setShowForm(true);
  };

  const handleSubmit = async (formData: {
    name: FormDataEntryValue | null;
    email: FormDataEntryValue | null;
    currentLevel: FormDataEntryValue | null;
    desiredLevel: FormDataEntryValue | null;
    currentIncome: FormDataEntryValue | null;
    decisionMaker: FormDataEntryValue | null;
  }) => {
    console.log('handleSubmit called with:', formData);
    console.log('selectedDate:', selectedDate, 'selectedTime:', selectedTime);
    
    if (!selectedDate || !selectedTime) {
      console.log('Missing selectedDate or selectedTime, returning');
      return;
    }

    console.log('Setting isSubmitting to true');
    setIsSubmitting(true);

    try {
      const bookingData = {
        ...formData,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Create appointment and send emails
      console.log('Creating appointment and sending emails...', bookingData);
      const response = await fetch('/api/appointment/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();
      console.log('Google Calendar result:', result);

      if (result.success) {
        console.log('Calendar event created successfully:', result.event_id);
        
        // Refresh available slots to reflect the newly booked time
        if (selectedDate) {
          await fetchAvailableSlots(selectedDate);
          
          // Update the date availability map
          const dateStr = format(selectedDate, 'yyyy-MM-dd');
          const updatedMap = new Map(datesWithSlots);
          const response = await fetch(`/api/google-calendar/available-slots/${dateStr}`);
          const data = await response.json();
          const hasSlots = data.success && data.available_slots && data.available_slots.length > 0;
          updatedMap.set(dateStr, hasSlots);
          setDatesWithSlots(updatedMap);
        }
      } else {
        console.warn('Calendar event creation failed:', result.error);
      }

      if (onSuccess) {
        onSuccess({
          date: bookingData.date,
          time: bookingData.time
        });
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      // Still proceed with success even if calendar fails
      const fallbackData = {
        ...formData,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      if (onSuccess) {
        onSuccess({
          date: fallbackData.date,
          time: fallbackData.time
        });
      }
    } finally {
      console.log('Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => addDays(startOfMonth(prev), -1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addDays(endOfMonth(prev), 1));
  };

  return (
    <div className="bg-white w-full max-w-full mx-auto rounded-lg overflow-hidden border-0 md:border md:border-gray-200 relative" style={{minHeight: '700px'}}>
      {/* Vertical separator between left panel and center content */}
      <div className="absolute top-0 left-96 w-px h-full bg-gray-200 hidden lg:block"></div>
      <div className="flex flex-col">
        <div className="flex flex-col lg:flex-row">
          {/* Left Panel - Event Details */}
          <div className="lg:w-96 lg:flex-shrink-0 p-4 lg:p-6 flex flex-col items-start relative">
            {/* Logo */}
            <div className="hidden lg:block mb-8 w-full">
              <div className="w-full h-24 bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-lg font-semibold">AstroForYou</span>
              </div>
              <div className="-mx-6 h-px bg-gray-300"></div>
            </div>

            {/* Profile */}
            <div className="mb-6 text-center lg:text-left w-full">
              <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 overflow-hidden mx-auto lg:mx-0">
                <img src="/speaker.jpg" alt="Anna Raight" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-base text-gray-600 mb-1 lg:ml-[-4px]">Anna Raight</h3>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 lg:ml-[-4px]">Discovery Call</h2>
            </div>

            {/* Mobile separator line after Discovery Call */}
            <div className="w-screen -ml-4 h-[0.5px] bg-black mb-6 lg:hidden"></div>


            {/* Details */}
            <div className="space-y-3 text-gray-600 text-sm w-full">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-gray-500">45 min</span>
              </div>
              <div className="flex items-center">
                <svg className="w-10 h-10 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-500 font-semibold" style={{textAlign: 'left', marginLeft: '-4px'}}>Web conferencing details provided upon confirmation.</span>
              </div>
              
              {/* Appointment Details */}
              {selectedDate && selectedTime && showForm && (
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-500 font-semibold" style={{textAlign: 'left', marginLeft: '-4px'}}>
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
                  </span>
                </div>
              )}
            </div>


            <div className="text-base text-gray-900 text-left lg:ml-[-4px] w-full">
              <p>Let me teach you Astrology.</p>
            </div>

            {/* Mobile separator line after description */}
            <div className="w-screen -ml-4 h-[0.5px] bg-black mt-6 lg:hidden"></div>
          </div>

          {/* Center and Right Panels */}
          <div className="flex-1 flex flex-col lg:flex-row">
            {!showForm ? (
              <>
                {/* Calendar Section */}
                <div className="p-4 lg:p-6 flex-1">
                  {/* Title */}
                  <h1 className="text-xl font-semibold text-gray-900 mb-8" style={{textAlign: 'left', marginLeft: '-4px'}}>Select a Date & Time</h1>
                  
                  {/* Calendar Header */}
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-lg text-gray-900">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h3>
                    <button
                      onClick={goToNextMonth}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="mb-8 overflow-hidden">
                    <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                        <div key={day} className="text-xs font-semibold text-gray-400 text-center py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                      {allDays.slice(0, 35).map((date, index) => {
                        const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                        const isAvailable = isDateAvailable(date);
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        
                        // Check if date has no available slots (fully booked)
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const hasSlots = datesWithSlots.get(dateStr);
                        const isFullyBooked = isCurrentMonth && availableDates.some(d => isSameDay(d, date)) && hasSlots === false;

                        let buttonClasses = 'relative w-11 h-11 text-sm transition-all rounded-lg ';
                        
                        if (!isCurrentMonth) {
                          buttonClasses += 'text-gray-300 ';
                        } else if (isSelected) {
                          buttonClasses += 'text-white ';
                        } else if (isFullyBooked) {
                          buttonClasses += 'cursor-not-allowed text-red-400 bg-red-50 ';
                        } else if (isAvailable) {
                          buttonClasses += 'hover:bg-blue-50 cursor-pointer text-blue-600 font-semibold ';
                        } else {
                          buttonClasses += 'cursor-not-allowed text-gray-400 ';
                        }

                        return (
                          <div key={index} className="flex items-center justify-center">
                            <button
                              onClick={() => handleDateSelect(date)}
                              onMouseEnter={() => checkDateAvailability(date)}
                              disabled={!isAvailable || !isCurrentMonth}
                              className={buttonClasses}
                            >
                              {isSelected && (
                                <div className="absolute inset-0 bg-blue-600 rounded-full" />
                              )}
                              <span className="relative z-10">{date.getDate()}</span>
                              {isFullyBooked && (
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                                  <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Legend */}
                  
                  {/* Timezone */}
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-2" style={{textAlign: 'left', marginLeft: '-4px'}}>Time zone</h4>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {mounted ? `${Intl.DateTimeFormat().resolvedOptions().timeZone.replace('_', ' ')} (${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})` : 'Loading timezone...'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Right Panel - Time Slots */}
                {selectedDate && (
                  <div className="w-full lg:w-[50rem] xl:w-[60rem] 2xl:w-[70rem] lg:flex-shrink-0 p-4 lg:p-6 animate-fadeIn">
                    {/* Back button on mobile */}
                    <div className="mb-4 md:hidden">
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to calendar
                      </button>
                    </div>
                    
                    {/* Date header aligned with main title */}
                    <div className="flex items-center justify-center gap-6 mb-6">
                      <h4 className="text-xl font-semibold text-gray-900 whitespace-nowrap">
                        {format(selectedDate, 'EEEE, MMMM d')}
                      </h4>
                    </div>

                    {/* Time Slots - starting at same level as calendar grid */}
                    <div className="pr-2">
                      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                      {loadingSlots ? (
                        <div className="col-span-full flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">Loading available times...</span>
                        </div>
                      ) : timeSlots.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          No available times for this date
                        </div>
                      ) : (
                        timeSlots.map(time => (
                            <div key={time}>
                              {selectedTime === time ? (
                                // Selected time - show side by side buttons with animation
                                <div className="col-span-full mb-4 animate-in slide-in-from-top-2 duration-300">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setSelectedTime(null)}
                                      className="flex-1 py-2 px-3 text-center rounded-md border transition-all duration-300 font-medium bg-gray-500 text-white border-gray-500 min-h-[40px] flex items-center justify-center text-sm transform hover:scale-105"
                                    >
                                      <span>{time}</span>
                                    </button>
                                    <button
                                      onClick={handleNext}
                                      disabled={isSubmitting}
                                      className="flex-1 py-2 px-3 text-center rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 text-sm min-h-[40px] flex items-center justify-center transform hover:scale-105"
                                    >
                                      <span>Next</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // Unselected time - normal button
                                <button
                                  onClick={() => handleTimeSelect(time)}
                                  className="w-full py-2 px-3 text-center rounded-md border transition-all font-medium text-blue-600 border border-gray-300 hover:border-blue-500 hover:shadow-sm min-h-[40px] flex items-center justify-center text-sm"
                                >
                                  <span>{time}</span>
                                </button>
                              )}
                            </div>
                          ))
                      )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Form Panel - Full Width */
              <div className="flex-1 p-4 lg:p-8 animate-fadeIn">
                <div className="max-w-2xl">
                  <div className="mb-6">
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2" style={{textAlign: 'left', marginLeft: '-4px'}}>Enter Details</h2>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleSubmit({
                      name: formData.get('name'),
                      email: formData.get('email'),
                      currentLevel: formData.get('currentLevel'),
                      desiredLevel: formData.get('desiredLevel'),
                      currentIncome: formData.get('currentIncome'),
                      decisionMaker: formData.get('decisionMaker'),
                    });
                  }} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2" style={{textAlign: 'left', marginLeft: '-4px'}}>
                        Name *
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2" style={{textAlign: 'left', marginLeft: '-4px'}}>
                        Email *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>


                    <div>
                      <label htmlFor="currentLevel" className="block text-sm font-medium text-gray-900 mb-2" style={{textAlign: 'left', marginLeft: '-4px'}}>
                        What&apos;s your current level of Astrology knowledge? *
                      </label>
                      <textarea
                        id="currentLevel"
                        name="currentLevel"
                        required
                        rows={4}
                        className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="desiredLevel" className="block text-sm font-medium text-gray-900 mb-2" style={{textAlign: 'left', marginLeft: '-4px'}}>
                        What&apos;s your desired level of Astrology knowledge? *
                      </label>
                      <textarea
                        id="desiredLevel"
                        name="desiredLevel"
                        required
                        rows={4}
                        className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="currentIncome" className="block text-sm font-medium text-gray-900 mb-2" style={{textAlign: 'left', marginLeft: '-4px'}}>
                        What&apos;s your current income? *
                      </label>
                      <input
                        id="currentIncome"
                        name="currentIncome"
                        type="text"
                        required
                        className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="decisionMaker" className="block text-sm font-medium text-gray-900 mb-2" style={{textAlign: 'left', marginLeft: '-4px'}}>
                        Are you the sole decision maker? *
                      </label>
                      <input
                        id="decisionMaker"
                        name="decisionMaker"
                        type="text"
                        required
                        className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="pt-6">
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        By proceeding, you confirm that you have read and agree to{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-700">Calendly&apos;s Terms of Use</a>{' '}
                        and{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Notice</a>.
                      </p>
                      
                      <button 
                        type="submit" 
                        className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                        disabled={isSubmitting}
                        onClick={() => console.log('Form submit button clicked, isSubmitting:', isSubmitting)}
                      >
                        {isSubmitting ? 'Scheduling Event...' : 'Schedule Event'}
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}