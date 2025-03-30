import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const GlucoseChart = ({ data, timeRange = '6m' }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  
  // Time range options
  const timeRangeOptions = [
    { value: '1m', label: '1 เดือน' },
    { value: '3m', label: '3 เดือน' },
    { value: '6m', label: '6 เดือน' },
    { value: '1y', label: '1 ปี' }
  ];
  
  // Filter data based on selected time range
  const getFilteredData = () => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let cutoffDate;
    
    switch (selectedTimeRange) {
      case '1m':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3m':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '1y':
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case '6m':
      default:
        cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
    }
    
    // If data already has date objects, use them
    // Otherwise, convert string dates to Date objects for comparison
    if (typeof data[0].date === 'string') {
      return data.filter(item => new Date(item.date) >= cutoffDate);
    }
    
    // For data that uses month as a label without a year, just return all data
    // In a real app, you would need more complex date handling
    return data;
  };
  
  const filteredData = getFilteredData();
  
  // Target ranges for glucose levels
  const fastingTarget = { min: 70, max: 95 };
  const postMealTarget = { min: 70, max: 140 };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value} mg/dL
            </p>
          ))}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">แนวโน้มค่าน้ำตาลเฉลี่ย (mg/dL)</h2>
        <div className="flex space-x-2">
          {timeRangeOptions.map(option => (
            <button
              key={option.value}
              className={`px-3 py-1 text-sm rounded-md ${
                selectedTimeRange === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedTimeRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[60, 180]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Reference lines for target ranges */}
            <ReferenceLine y={fastingTarget.max} stroke="#fbbf24" strokeDasharray="3 3" label={{ value: 'เป้าหมายงดอาหาร', position: 'left', fill: '#fbbf24', fontSize: 12 }} />
            <ReferenceLine y={postMealTarget.max} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'เป้าหมายหลังอาหาร', position: 'right', fill: '#ef4444', fontSize: 12 }} />
            
            <Line 
              type="monotone" 
              dataKey="avgFasting" 
              stroke="#3182ce" 
              name="ระดับน้ำตาลตอนเช้า" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="avgPostMeal" 
              stroke="#e53e3e" 
              name="ระดับน้ำตาลหลังอาหาร" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>* ค่าเฉลี่ยต่อเดือนจากข้อมูลผู้ป่วยทั้งหมด</p>
      </div>
    </div>
  );
};

export default GlucoseChart;