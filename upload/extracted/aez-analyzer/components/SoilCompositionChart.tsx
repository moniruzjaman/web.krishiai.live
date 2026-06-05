import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SoilComposition } from '../types';

interface Props {
  data: SoilComposition;
}

const SoilCompositionChart: React.FC<Props> = ({ data }) => {
  const chartData = [
    { name: 'Sand', value: Number(data.sand), color: '#eab308' }, // Yellow-500
    { name: 'Silt', value: Number(data.silt), color: '#a8a29e' }, // Stone-400
    { name: 'Clay', value: Number(data.clay), color: '#78350f' }, // Amber-900
  ];

  return (
    <div className="h-64 w-full bg-white rounded-xl shadow-sm border border-earth-200 p-4">
      <h3 className="text-sm font-semibold text-earth-800 mb-2 text-center uppercase tracking-wider">Composition</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `${value}%`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SoilCompositionChart;