import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import Button from '../../../components/ui/Button';

const PerformanceChart = () => {
  const [activeChart, setActiveChart] = useState('revenue');

  const revenueData = [
    { month: 'Jan', revenue: 45000, vehicles: 120, owners: 85 },
    { month: 'Feb', revenue: 52000, vehicles: 135, owners: 92 },
    { month: 'Mar', revenue: 48000, vehicles: 128, owners: 88 },
    { month: 'Apr', revenue: 61000, vehicles: 145, owners: 98 },
    { month: 'May', revenue: 55000, vehicles: 142, owners: 95 },
    { month: 'Jun', revenue: 67000, vehicles: 158, owners: 105 },
    { month: 'Jul', revenue: 72000, vehicles: 165, owners: 110 },
    { month: 'Aug', revenue: 69000, vehicles: 162, owners: 108 }
  ];

  const utilizationData = [
    { name: 'Active', value: 142, color: '#10B981' },
    { name: 'Maintenance', value: 18, color: '#F59E0B' },
    { name: 'Idle', value: 8, color: '#DC2626' }
  ];

  const performanceData = [
    { owner: 'TVP001', earnings: 12500, trips: 245, rating: 4.8 },
    { owner: 'TVP002', earnings: 11200, trips: 220, rating: 4.6 },
    { owner: 'TVP003', earnings: 10800, trips: 210, rating: 4.7 },
    { owner: 'TVP004', earnings: 9500, trips: 185, rating: 4.5 },
    { owner: 'TVP005', earnings: 8900, trips: 175, rating: 4.4 }
  ];

  const chartOptions = [
    { key: 'revenue', label: 'Revenue Trends', icon: 'TrendingUp' },
    { key: 'utilization', label: 'Vehicle Utilization', icon: 'PieChart' },
    { key: 'performance', label: 'Owner Performance', icon: 'BarChart3' }
  ];

  const renderChart = () => {
    switch (activeChart) {
      case 'revenue':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--color-popover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--color-primary)" 
                strokeWidth={3}
                dot={{ fill: 'var(--color-primary)', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="vehicles" 
                stroke="var(--color-accent)" 
                strokeWidth={2}
                dot={{ fill: 'var(--color-accent)', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'utilization':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={utilizationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {utilizationData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry?.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--color-popover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'performance':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="owner" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--color-popover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="earnings" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Performance Analytics</h3>
        <div className="flex items-center space-x-2">
          {chartOptions?.map((option) => (
            <Button
              key={option?.key}
              variant={activeChart === option?.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveChart(option?.key)}
              iconName={option?.icon}
              iconPosition="left"
              iconSize={16}
            >
              {option?.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        {renderChart()}
      </div>
      {activeChart === 'utilization' && (
        <div className="flex items-center justify-center space-x-6 mt-4">
          {utilizationData?.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item?.color }}
              ></div>
              <span className="text-sm text-muted-foreground">
                {item?.name}: {item?.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerformanceChart;