import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Calendar, Activity, Clock, Filter, Plus, AlertTriangle, Download, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Glucose Tracker component for displaying and analyzing glucose readings
 * @param {Object} props - Component props
 * @param {Array} props.readings - Array of glucose reading data
 * @param {Object} props.patient - Patient data
 * @param {Function} props.onAddReading - Function to handle adding new reading
 * @param {Function} props.onDeleteReading - Function to handle reading deletion
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Glucose tracker component
 */
const GlucoseTracker = ({ 
  readings, 
  patient, 
  onAddReading, 
  onDeleteReading, 
  loading = false 
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedType, setSelectedType] = useState('all');
  const [filteredReadings, setFilteredReadings] = useState([]);
  const [sortField, setSortField] = useState('reading_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showChart, setShowChart] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    min: 0,
    max: 0,
    inRange: 0,
    outOfRange: 0,
    totalCount: 0
  });

  // Filter and sort readings when data changes
  useEffect(() => {
    if (!readings || readings.length === 0) {
      setFilteredReadings([]);
      setStats({
        average: 0,
        min: 0,
        max: 0,
        inRange: 0,
        outOfRange: 0,
        totalCount: 0
      });
      return;
    }

    // Filter based on time range
    const now = new Date();
    let cutoffDate;
    
    switch (selectedTimeRange) {
      case '1d':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        cutoffDate = new Date(0); // Beginning of time
        break;
    }
    
    let filtered = readings.filter(reading => {
      const readingDate = new Date(reading.reading_date);
      return readingDate >= cutoffDate;
    });
    
    // Filter based on reading type
    if (selectedType !== 'all') {
      filtered = filtered.filter(reading => reading.reading_type === selectedType);
    }
    
    // Sort readings
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortField === 'reading_date' || sortField === 'reading_time') {
        // Sort dates and times
        const dateA = new Date(`${a.reading_date}T${a.reading_time || '00:00:00'}`);
        const dateB = new Date(`${b.reading_date}T${b.reading_time || '00:00:00'}`);
        
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortField === 'glucose_value') {
        // Sort numeric values
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        // Sort strings
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
    });
    
    setFilteredReadings(filtered);
    
    // Calculate statistics
    if (filtered.length > 0) {
      const values = filtered.map(reading => reading.glucose_value);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / values.length);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const outOfRange = filtered.filter(reading => reading.out_of_range).length;
      
      setStats({
        average: avg,
        min: min,
        max: max,
        inRange: filtered.length - outOfRange,
        outOfRange: outOfRange,
        totalCount: filtered.length
      });
    }
  }, [readings, selectedTimeRange, selectedType, sortField, sortDirection]);
  
  // Handle sort change
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending for dates, ascending for others
      setSortField(field);
      setSortDirection(field === 'reading_date' || field === 'reading_time' ? 'desc' : 'asc');
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', options);
    } catch (e) {
      return dateString;
    }
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
  
  // Get target range based on reading type
  const getTargetRange = (type) => {
    switch (type) {
      case 'fasting':
        return { min: 70, max: 95 };
      case 'pre-meal':
        return { min: 70, max: 100 };
      case 'post-meal':
        return { min: 70, max: 140 };
      case 'bedtime':
        return { min: 70, max: 120 };
      default:
        return { min: 70, max: 180 };
    }
  };
  
  // Check if reading is out of range
  const isOutOfRange = (reading) => {
    if (!reading) return false;
    
    const { min, max } = getTargetRange(reading.reading_type);
    return reading.glucose_value < min || reading.glucose_value > max;
  };
  
  // Get reading type display text
  const getReadingTypeText = (type) => {
    switch (type) {
      case 'fasting':
        return 'ระดับน้ำตาลตอนเช้า';
      case 'pre-meal':
        return 'ก่อนอาหาร';
      case 'post-meal':
        return 'หลังอาหาร';
      case 'bedtime':
        return 'ก่อนนอน';
      default:
        return type;
    }
  };
  
  // Format data for chart
  const formatChartData = () => {
    if (!filteredReadings || filteredReadings.length === 0) return [];
    
    // Clone and sort by date (ascending) for chart
    const sortedReadings = [...filteredReadings].sort((a, b) => {
      const dateA = new Date(`${a.reading_date}T${a.reading_time || '00:00:00'}`);
      const dateB = new Date(`${b.reading_date}T${b.reading_time || '00:00:00'}`);
      return dateA - dateB;
    });
    
    // Group readings by date and type
    const groupedData = {};
    
    sortedReadings.forEach(reading => {
      const date = reading.reading_date;
      if (!groupedData[date]) {
        groupedData[date] = {
          date: formatDate(date),
          fasting: null,
          preMeal: null,
          postMeal: null,
          bedtime: null
        };
      }
      
      switch (reading.reading_type) {
        case 'fasting':
          groupedData[date].fasting = reading.glucose_value;
          break;
        case 'pre-meal':
          groupedData[date].preMeal = reading.glucose_value;
          break;
        case 'post-meal':
          groupedData[date].postMeal = reading.glucose_value;
          break;
        case 'bedtime':
          groupedData[date].bedtime = reading.glucose_value;
          break;
        default:
          break;
      }
    });
    
    return Object.values(groupedData);
  };
  
  // Chart data
  const chartData = formatChartData();
  
  // Maximum target line value for chart visibility
  const maxTargetLine = Math.max(
    getTargetRange('fasting').max,
    getTargetRange('pre-meal').max,
    getTargetRange('post-meal').max,
    getTargetRange('bedtime').max
  );
  
  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => {
            if (entry.value === null) return null;
            
            let name = '';
            switch (entry.dataKey) {
              case 'fasting':
                name = 'ระดับน้ำตาลตอนเช้า';
                break;
              case 'preMeal':
                name = 'ก่อนอาหาร';
                break;
              case 'postMeal':
                name = 'หลังอาหาร';
                break;
              case 'bedtime':
                name = 'ก่อนนอน';
                break;
              default:
                name = entry.dataKey;
            }
            
            return (
              <p key={index} style={{ color: entry.color }}>
                {name}: {entry.value} mg/dL
              </p>
            );
          })}
        </div>
      );
    }
    
    return null;
  };
  
  // Export readings to CSV
  const exportToCSV = () => {
    if (!filteredReadings || filteredReadings.length === 0) return;
    
    // Create CSV header
    const csvHeader = ['วันที่', 'เวลา', 'ประเภทการวัด', 'ค่าน้ำตาล (mg/dL)', 'ค่าปกติ', 'หมายเหตุ'];
    
    // Create CSV rows
    const csvRows = filteredReadings.map(reading => [
      reading.reading_date,
      reading.reading_time,
      getReadingTypeText(reading.reading_type),
      reading.glucose_value,
      reading.out_of_range ? 'ผิดปกติ' : 'ปกติ',
      reading.notes || ''
    ]);
    
    // Combine header and rows
    const csvContent = [
      csvHeader.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `glucose_readings_${patient?.medical_record_number || 'export'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 md:mb-0">
          ติดตามค่าระดับน้ำตาล
        </h2>
        
        <div className="flex flex-wrap space-x-2">
          <button
            onClick={() => onAddReading()}
            className="px-3 py-1 inline-flex items-center text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-1 h-4 w-4" /> เพิ่มค่าน้ำตาล
          </button>
          
          <button
            onClick={exportToCSV}
            disabled={!filteredReadings || filteredReadings.length === 0}
            className={`px-3 py-1 inline-flex items-center text-sm font-medium rounded-md ${
              !filteredReadings || filteredReadings.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'text-white bg-green-600 hover:bg-green-700'
            }`}
          >
            <Download className="mr-1 h-4 w-4" /> ส่งออก CSV
          </button>
          
          <button
            onClick={() => setShowChart(!showChart)}
            className="px-3 py-1 inline-flex items-center text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
          >
            {showChart ? 'ดูตาราง' : 'ดูกราฟ'}
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2">
        <div className="flex items-center">
          <Filter className="h-4 w-4 text-gray-500 mr-1" />
          <span className="text-sm text-gray-500 mr-2">ช่วงเวลา:</span>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1d">1 วัน</option>
            <option value="7d">7 วัน</option>
            <option value="30d">30 วัน</option>
            <option value="90d">90 วัน</option>
            <option value="all">ทั้งหมด</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-gray-500 mr-1" />
          <span className="text-sm text-gray-500 mr-2">ประเภท:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-sm border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">ทั้งหมด</option>
            <option value="fasting">ระดับน้ำตาลตอนเช้า</option>
            <option value="pre-meal">ก่อนอาหาร</option>
            <option value="post-meal">หลังอาหาร</option>
            <option value="bedtime">ก่อนนอน</option>
          </select>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-gray-500">เฉลี่ย</p>
            <p className="text-xl font-semibold">{stats.average} <span className="text-sm text-gray-500">mg/dL</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ต่ำสุด</p>
            <p className="text-xl font-semibold">{stats.min} <span className="text-sm text-gray-500">mg/dL</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-500">สูงสุด</p>
            <p className="text-xl font-semibold">{stats.max} <span className="text-sm text-gray-500">mg/dL</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-500">จำนวนครั้ง</p>
            <p className="text-xl font-semibold">{stats.totalCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ผิดปกติ</p>
            <p className="text-xl font-semibold text-yellow-600">{stats.outOfRange} <span className="text-sm text-gray-500">({stats.totalCount > 0 ? Math.round((stats.outOfRange / stats.totalCount) * 100) : 0}%)</span></p>
          </div>
        </div>
      </div>
      
      {/* Chart view */}
      {showChart ? (
        <div className="p-6">
          {chartData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={50} />
                  <YAxis domain={[Math.max(0, stats.min - 20), Math.max(stats.max + 20, maxTargetLine + 20)]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Reference lines for target ranges */}
                  <ReferenceLine y={getTargetRange('fasting').max} stroke="#fbbf24" strokeDasharray="3 3" />
                  <ReferenceLine y={getTargetRange('post-meal').max} stroke="#ef4444" strokeDasharray="3 3" />
                  
                  <Line type="monotone" dataKey="fasting" name="ระดับน้ำตาลตอนเช้า" stroke="#3b82f6" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="preMeal" name="ก่อนอาหาร" stroke="#10b981" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="postMeal" name="หลังอาหาร" stroke="#ef4444" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="bedtime" name="ก่อนนอน" stroke="#8b5cf6" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีข้อมูล</h3>
              <p className="mt-1 text-sm text-gray-500">ไม่พบข้อมูลค่าระดับน้ำตาลในช่วงเวลาที่เลือก</p>
              <div className="mt-6">
                <button
                  onClick={() => onAddReading()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="mr-2 h-4 w-4" /> เพิ่มค่าน้ำตาล
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6">
          {filteredReadings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('reading_date')}
                    >
                      <div className="flex items-center">
                        <span>วันที่</span>
                        {sortField === 'reading_date' && (
                          sortDirection === 'asc' ? 
                            <ArrowUp className="ml-1 h-4 w-4" /> : 
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('reading_time')}
                    >
                      <div className="flex items-center">
                        <span>เวลา</span>
                        {sortField === 'reading_time' && (
                          sortDirection === 'asc' ? 
                            <ArrowUp className="ml-1 h-4 w-4" /> : 
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('reading_type')}
                    >
                      <div className="flex items-center">
                        <span>ประเภท</span>
                        {sortField === 'reading_type' && (
                          sortDirection === 'asc' ? 
                            <ArrowUp className="ml-1 h-4 w-4" /> : 
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('glucose_value')}
                    >
                      <div className="flex items-center">
                        <span>ค่าน้ำตาล</span>
                        {sortField === 'glucose_value' && (
                          sortDirection === 'asc' ? 
                            <ArrowUp className="ml-1 h-4 w-4" /> : 
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      หมายเหตุ
                    </th>
                    <th scope="col" className="relative px-4 py-3">
                      <span className="sr-only">แก้ไข</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReadings.map((reading) => (
                    <tr key={reading.id} className={reading.out_of_range ? 'bg-yellow-50' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(reading.reading_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(reading.reading_time)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {getReadingTypeText(reading.reading_type)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${reading.out_of_range ? 'text-yellow-600' : 'text-gray-900'}`}>
                            {reading.glucose_value} mg/dL
                          </span>
                          {reading.out_of_range && (
                            <AlertTriangle className="ml-1 h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {reading.notes || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/glucose/edit/${reading.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          แก้ไข
                        </Link>
                        <button 
                          onClick={() => onDeleteReading(reading.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีข้อมูล</h3>
              <p className="mt-1 text-sm text-gray-500">ไม่พบข้อมูลค่าระดับน้ำตาลในช่วงเวลาที่เลือก</p>
              <div className="mt-6">
                <button
                  onClick={() => onAddReading()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="mr-2 h-4 w-4" /> เพิ่มค่าน้ำตาล
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlucoseTracker;