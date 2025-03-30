import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Calendar as CalendarIcon } from 'lucide-react';
import { format, parse, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, 
  isSameDay, addMonths, subMonths, parseISO, isValid, isWithinInterval } from 'date-fns';
import { th } from 'date-fns/locale';

const AppointmentCalendar = ({ appointments, onSelectDate, onSelectAppointment, onAddAppointment }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [dayAppointments, setDayAppointments] = useState([]);
  
  // Format dates using Thai locale
  const formatThai = (date, formatStr) => {
    return format(date, formatStr, { locale: th });
  };
  
  // Update calendar days whenever the current month changes
  useEffect(() => {
    const daysInMonth = [];
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    let day = startDate;
    while (day <= endDate) {
      daysInMonth.push(day);
      day = addDays(day, 1);
    }
    
    setCalendarDays(daysInMonth);
  }, [currentMonth]);
  
  // Update day appointments whenever the selected date changes
  useEffect(() => {
    if (appointments) {
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const filtered = appointments.filter(appointment => {
        if (!appointment.appointment_date) return false;
        
        let appointmentDate;
        if (typeof appointment.appointment_date === 'string') {
          appointmentDate = parseISO(appointment.appointment_date);
          if (!isValid(appointmentDate)) return false;
        } else {
          appointmentDate = appointment.appointment_date;
        }
        
        return isWithinInterval(appointmentDate, { start: dayStart, end: dayEnd });
      });
      
      // Sort by time
      filtered.sort((a, b) => {
        const timeA = a.appointment_time ? parse(a.appointment_time, 'HH:mm:ss', new Date()) : new Date();
        const timeB = b.appointment_time ? parse(b.appointment_time, 'HH:mm:ss', new Date()) : new Date();
        return timeA - timeB;
      });
      
      setDayAppointments(filtered);
      
      // Notify parent component about date selection
      if (onSelectDate) {
        onSelectDate(selectedDate);
      }
    }
  }, [selectedDate, appointments, onSelectDate]);
  
  // Previous month handler
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Next month handler
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Date click handler
  const onDateClick = (day) => {
    setSelectedDate(day);
  };
  
  // Render appointment count badges for each day
  const renderAppointmentsBadge = (day) => {
    if (!appointments) return null;
    
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    const count = appointments.filter(appointment => {
      if (!appointment.appointment_date) return false;
      
      let appointmentDate;
      if (typeof appointment.appointment_date === 'string') {
        appointmentDate = parseISO(appointment.appointment_date);
        if (!isValid(appointmentDate)) return false;
      } else {
        appointmentDate = appointment.appointment_date;
      }
      
      return isWithinInterval(appointmentDate, { start: dayStart, end: dayEnd });
    }).length;
    
    if (count > 0) {
      return (
        <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
          {count}
        </span>
      );
    }
    
    return null;
  };
  
  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // Strip seconds if present (HH:MM:SS -> HH:MM)
    if (timeString.length > 5) {
      return timeString.substring(0, 5);
    }
    
    return timeString;
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">ปฏิทินนัดหมาย</h2>
          <p className="text-sm text-gray-500">{formatThai(currentMonth, 'MMMM yyyy')}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="calendar-container p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, i) => (
            <div
              key={i}
              className="text-center font-medium text-gray-500 text-sm py-2"
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => (
            <div
              key={i}
              className={`
                relative min-h-[70px] p-1 border rounded-md cursor-pointer
                ${!isSameMonth(day, currentMonth) ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                ${isSameDay(day, selectedDate) ? 'border-blue-500' : 'border-gray-200'}
                hover:bg-gray-50
              `}
              onClick={() => onDateClick(day)}
            >
              <div className={`
                text-right text-sm font-medium py-1 px-2
                ${isSameDay(day, new Date()) ? 'bg-blue-100 text-blue-800 rounded-md' : ''}
              `}>
                {format(day, 'd')}
              </div>
              {renderAppointmentsBadge(day)}
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-gray-800">
            {formatThai(selectedDate, 'd MMMM yyyy')}
          </h3>
          <button
            onClick={() => onAddAppointment(selectedDate)}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={16} className="mr-1" />
            เพิ่มนัดหมาย
          </button>
        </div>
        
        {dayAppointments.length > 0 ? (
          <div className="space-y-2">
            {dayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectAppointment(appointment)}
              >
                <div className="flex-shrink-0 mr-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Clock size={20} className="text-blue-600" />
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        {formatTime(appointment.appointment_time)} - {appointment.appointment_type}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <User size={14} className="mr-1" />
                        {appointment.patient_first_name} {appointment.patient_last_name}
                      </p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(appointment.status)}`}>
                        {appointment.status === 'completed' ? 'เสร็จสิ้น' :
                         appointment.status === 'cancelled' ? 'ยกเลิก' :
                         appointment.status === 'no-show' ? 'ไม่มา' : 'นัดหมาย'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีนัดหมาย</h3>
            <p className="mt-1 text-sm text-gray-500">ไม่พบการนัดหมายในวันที่เลือก</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentCalendar;