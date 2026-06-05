import React, { useState } from 'react';
import { BANGLADESH_AEZS } from '../constants';
import { AEZData } from '../types';
import { MapPin, Search, CheckCircle2 } from 'lucide-react';

interface Props {
  onSelect: (aez: AEZData) => void;
  selectedId?: number;
}

const AEZSelector: React.FC<Props> = ({ onSelect, selectedId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAEZs = BANGLADESH_AEZS.filter(aez => 
    aez.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    aez.id.toString().includes(searchTerm)
  );

  return (
    <div className="w-full flex flex-col h-full">      
      <div className="relative mb-3 flex-shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-earth-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2.5 border border-earth-200 rounded-xl bg-earth-50 text-earth-900 placeholder-earth-400 focus:outline-none focus:ring-2 focus:ring-agri-500/50 focus:border-agri-500 text-sm transition-all"
          placeholder="Search AEZ (e.g. 28 or Madhupur)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto border border-earth-100 rounded-xl bg-earth-50/50 custom-scrollbar shadow-inner p-1 min-h-0">
        {filteredAEZs.length > 0 ? (
          <ul className="space-y-1">
            {filteredAEZs.map((aez) => (
              <li 
                key={aez.id}
                onClick={() => onSelect(aez)}
                className={`cursor-pointer px-4 py-3 rounded-lg transition-all flex items-center gap-3 group
                  ${selectedId === aez.id 
                    ? 'bg-agri-100 text-agri-900 shadow-sm border border-agri-200' 
                    : 'hover:bg-white hover:shadow-sm text-earth-700 border border-transparent'}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${selectedId === aez.id ? 'bg-agri-200 text-agri-800' : 'bg-earth-200 text-earth-600 group-hover:bg-earth-100'}`}>
                    {aez.id}
                </div>
                
                <span className="text-sm font-medium flex-grow truncate">
                  {aez.name}
                </span>

                {selectedId === aez.id && (
                    <CheckCircle2 className="w-4 h-4 text-agri-600" />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-earth-400 p-4 text-center">
            <Search className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No zones match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AEZSelector;