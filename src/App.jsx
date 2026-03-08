import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Music, BookOpen, Calendar, 
  Hash, AlertCircle, X,
  Church, ChevronDown
} from 'lucide-react';

// A robust CSV parser to handle quotes and commas properly
const parseCSV = (str) => {
  const result = [];
  let row = [];
  let inQuotes = false;
  let currentValue = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const nextChar = str[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentValue += '"';
      i++; // skip next quote
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(currentValue);
      currentValue = '';
    } else if (char === '\n' && !inQuotes) {
      row.push(currentValue);
      result.push(row);
      row = [];
      currentValue = '';
    } else if (char !== '\r') {
      currentValue += char;
    }
  }
  // push remaining
  if (currentValue !== '' || str[str.length - 1] === ',') {
    row.push(currentValue);
  }
  if (row.length > 0) result.push(row);
  if (result.length < 2) return [];

  const headers = result[0].map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < result.length; i++) {
    if (result[i].length === 1 && result[i][0].trim() === '') continue; // skip empty rows
    const obj = {};
    result[i].forEach((val, idx) => {
      if (headers[idx]) {
        obj[headers[idx]] = val ? val.trim() : '';
      }
    });
    // Only push if it has a Title or Catalog Number (filters out completely empty trailing rows)
    if (obj['Title'] || obj['Catalog Number']) {
        data.push(obj);
    }
  }
  return data;
};




export default function App() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);

useEffect(() => {
  fetch('/data.csv')
    .then(response => response.text())
    .then(text => {
      const parsed = parseCSV(text);
      setData(parsed);
    })
    .catch(err => {
      console.error('Error loading CSV:', err);
    });
}, []);

  // Extract unique liturgical seasons
  const uniqueSeasons = useMemo(() => {
    const seasons = new Set();
    data.forEach(item => {
      if (item['General Liturgical Season']) {
        seasons.add(item['General Liturgical Season'].trim());
      }
    });
    return Array.from(seasons).sort();
  }, [data]);

  // Extract unique themes
  const uniqueThemes = useMemo(() => {
    const themes = new Set();
    data.forEach(item => {
      if (item['Themes / Topics']) {
        item['Themes / Topics'].split('|').forEach(t => themes.add(t.trim()));
      }
    });
    return Array.from(themes).sort();
  }, [data]);

  // The omni-search filter
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 1. Text Search Filter
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || (
        (item['Catalog Number'] && item['Catalog Number'].toLowerCase().includes(term)) ||
        (item['Title'] && item['Title'].toLowerCase().includes(term)) ||
        (item['Composer'] && item['Composer'].toLowerCase().includes(term)) ||
        (item['Bible Verse Reference'] && item['Bible Verse Reference'].toLowerCase().includes(term)) ||
        (item['Themes / Topics'] && item['Themes / Topics'].toLowerCase().includes(term)) ||
        (item['Narrative Lectionary Weeks'] && item['Narrative Lectionary Weeks'].toLowerCase().includes(term)) ||
        (item['General Liturgical Season'] && item['General Liturgical Season'].toLowerCase().includes(term))
      );

      // 2. Season Filter
      const matchesSeason = !selectedSeason || (item['General Liturgical Season'] && item['General Liturgical Season'].includes(selectedSeason));

      // 3. Theme Filter
      const matchesTheme = !selectedTheme || (item['Themes / Topics'] && item['Themes / Topics'].includes(selectedTheme));

      return matchesSearch && matchesSeason && matchesTheme;
    });
  }, [data, searchTerm, selectedSeason, selectedTheme]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* Header Area */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <img 
                src="https://scontent-ord5-3.xx.fbcdn.net/v/t39.30808-6/357806409_659780686191965_405722011328298247_n.png?_nc_cat=106&ccb=1-7&_nc_sid=2a1932&_nc_ohc=VLiWG90fyeYQ7kNvwFJ3olC&_nc_oc=AdnPyUo5PoHKjCA1x6GdvR6jfEpXy7Qn1yFf4b4qQcZUMUqztAorFp83NSiw6UbC0hc&_nc_zt=23&_nc_ht=scontent-ord5-3.xx&_nc_gid=py6TlDZtEoOmtecB2b9EWA&_nc_ss=8&oh=00_AfyzavA6JZfLUi0Ui7sFCH2vtASXt5ru6WKCO_6V3DucUQ&oe=69B2D320" 
                alt="Sparta UMC Logo" 
                className="h-16 w-auto object-contain rounded-md"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">Sparta UMC</h1>
                <h2 className="text-red-700 font-semibold tracking-wide uppercase text-sm">Choir Library</h2>
              </div>
            </div>

            {/* Omni-Search Bar */}
            <div className="w-full md:w-1/2 relative">
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search by title, composer, theme, bible verse, lectionary..." 
                  className="w-full pl-12 pr-10 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent shadow-sm transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Filtering Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          {/* Liturgical Seasons */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-red-700" /> 
              Worship Context
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSeason(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedSeason ? 'bg-red-700 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Contexts
              </button>
              {uniqueSeasons.map(season => (
                <button
                  key={season}
                  onClick={() => setSelectedSeason(season)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSeason === season ? 'bg-red-700 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {season}
                </button>
              ))}
            </div>
          </div>

          {/* Themes / Topics */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-red-700" />
              Themes & Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTheme(null)}
                className={`px-3 py-1.5 rounded-md text-sm transition-all border ${!selectedTheme ? 'bg-red-50 border-red-300 text-red-800 font-bold shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                All Themes
              </button>
              {uniqueThemes.map(theme => (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(theme)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all border ${selectedTheme === theme ? 'bg-red-50 border-red-300 text-red-800 font-bold shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center text-sm text-gray-600 font-medium">
          <span>Showing <strong className="text-gray-900">{filteredData.length}</strong> pieces of music</span>
        </div>

        {/* Library Table View */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                    Call #
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Title & Composer
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Worship Context
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Themes
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                    Copies
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                      <p className="text-lg font-medium text-gray-900">No music found</p>
                      <p>Try adjusting your search terms or upload your full CSV file.</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-red-50/40 transition-colors group">
                      
                      {/* Call Number */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row['Catalog Number'] ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            <Hash size={12} className="mr-1 opacity-50"/> {row['Catalog Number']}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm italic">N/A</span>
                        )}
                      </td>

                      {/* Title & Composer */}
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <Music className="text-red-700 mt-1 mr-3 flex-shrink-0" size={16} />
                          <div>
                            <div className="text-sm font-bold text-gray-900">{row['Title'] || 'Unknown Title'}</div>
                            <div className="text-sm text-gray-500 mt-0.5">{row['Composer'] || 'Unknown Composer'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Worship Context (Bible, Season, Lectionary) */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {row['Bible Verse Reference'] && (
                            <div className="flex items-start text-sm">
                              <BookOpen size={14} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{row['Bible Verse Reference']}</span>
                            </div>
                          )}
                          {(row['General Liturgical Season'] || row['Narrative Lectionary Weeks']) && (
                            <div className="flex items-start text-sm">
                              <Calendar size={14} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600">
                                {row['General Liturgical Season']}
                                {row['General Liturgical Season'] && row['Narrative Lectionary Weeks'] && ' • '}
                                {row['Narrative Lectionary Weeks']}
                              </span>
                            </div>
                          )}
                          {!row['Bible Verse Reference'] && !row['General Liturgical Season'] && !row['Narrative Lectionary Weeks'] && (
                            <span className="text-gray-400 text-sm italic">General Use</span>
                          )}
                        </div>
                      </td>

                      {/* Themes */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {row['Themes / Topics'] ? (
                            row['Themes / Topics'].split('|').map((theme, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                {theme.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm italic">None</span>
                          )}
                        </div>
                      </td>

                      {/* Count / Copies */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {row['Count'] ? (
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-sm font-bold text-gray-700 border border-gray-200">
                            {row['Count']}
                          </span>
                        ) : (
                           <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}