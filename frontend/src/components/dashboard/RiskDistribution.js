import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const RiskDistribution = ({ data }) => {
  // Format data for the pie chart
  const formatData = () => {
    if (!data) return [];
    
    return [
      { name: 'ความเสี่ยงสูง', value: data.high || 0, color: '#ff5252' },
      { name: 'ความเสี่ยงปานกลาง', value: data.medium || 0, color: '#ffb142' },
      { name: 'ความเสี่ยงต่ำ', value: data.low || 0, color: '#78e08f' },
    ].filter(item => item.value > 0);
  };
  
  const pieData = formatData();
  const totalPatients = (data?.high || 0) + (data?.medium || 0) + (data?.low || 0);
  
  // Custom label renderer
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return percent > 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{data.name}</p>
          <p>{data.value} คน ({((data.value / totalPatients) * 100).toFixed(1)}%)</p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">การกระจายตัวของผู้ป่วย</h2>
      
      {totalPatients > 0 ? (
        <div className="h-64 flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex justify-center items-center">
          <p className="text-gray-500">ไม่มีข้อมูลผู้ป่วย</p>
        </div>
      )}
      
      <div className="mt-2">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-red-50 rounded">
            <p className="font-medium text-red-700">ความเสี่ยงสูง</p>
            <p className="text-lg font-bold">{data?.high || 0}</p>
          </div>
          <div className="p-2 bg-yellow-50 rounded">
            <p className="font-medium text-yellow-700">ความเสี่ยงปานกลาง</p>
            <p className="text-lg font-bold">{data?.medium || 0}</p>
          </div>
          <div className="p-2 bg-green-50 rounded">
            <p className="font-medium text-green-700">ความเสี่ยงต่ำ</p>
            <p className="text-lg font-bold">{data?.low || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskDistribution;