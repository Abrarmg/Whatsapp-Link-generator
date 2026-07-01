/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, ChangeEvent, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  MessageSquare, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  Info, 
  Sparkles, 
  X,
  Upload,
  Download,
  FileText,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  History
} from 'lucide-react';

import { parsePhoneNumber, generateWhatsAppLink } from './utils/linkHelper';
import RecentLinksList from './components/RecentLinksList';
import { RecentLink } from './types';
import { COUNTRIES } from './data/staticData';

export default function App() {
  // Navigation State: 'single' | 'bulk'
  const [generatorMode, setGeneratorMode] = useState<'single' | 'bulk'>('single');

  // Fallback Country Code state
  const [defaultPrefix, setDefaultPrefix] = useState(() => {
    try {
      return localStorage.getItem('wa_default_prefix') || '92';
    } catch {
      return '92';
    }
  });

  // Save selected fallback country prefix to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wa_default_prefix', defaultPrefix);
    } catch (e) {
      console.error('Failed to save default country prefix:', e);
    }
  }, [defaultPrefix]);

  // --- SINGLE MODE STATES ---
  const [rawPhoneNumber, setRawPhoneNumber] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'qr'>('link');

  // --- BULK CSV MODE STATES ---
  const [csvFileName, setCsvFileName] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General state for offline history
  const [recentLinks, setRecentLinks] = useState<RecentLink[]>([]);

  // Parse phone number dynamically for Single Mode
  const parsedPhone = useMemo(() => {
    return parsePhoneNumber(rawPhoneNumber, defaultPrefix);
  }, [rawPhoneNumber, defaultPrefix]);

  // Generate Single Mode Link
  const generatedLink = useMemo(() => {
    if (!parsedPhone.isValid) return '';
    return generateWhatsAppLink(parsedPhone.sanitized, customMessage);
  }, [parsedPhone, customMessage]);

  // --- CSV PARSING & PROCESSING LOGIC ---
  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split(/\r?\n/);
    const result: string[][] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Basic CSV field extraction supporting double quotes
      const row: string[] = [];
      let insideQuote = false;
      let entry = '';
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          row.push(entry.trim());
          entry = '';
        } else {
          entry += char;
        }
      }
      row.push(entry.trim());
      result.push(row);
    }
    
    if (result.length === 0) {
      return { headers: [], rows: [] };
    }
    
    // Clean headers by stripping external quotes/whitespace
    const headers = result[0].map(h => h.replace(/^["']|["']$/g, '').trim());
    const rows = result.slice(1);
    return { headers, rows };
  };

  // Process rows dynamically to build the preview table & stats
  const processedCsvData = useMemo(() => {
    if (csvRows.length === 0) return [];
    
    // Scan headers to find phone columns
    const lowerHeaders = csvHeaders.map(h => h.toLowerCase());
    let phoneIdx = lowerHeaders.findIndex(h => 
      h.includes('phone') || 
      h.includes('number') || 
      h.includes('contact') || 
      h.includes('mobile') || 
      h.includes('cell') ||
      h.includes('tel')
    );
    if (phoneIdx === -1) {
      phoneIdx = 0; // Default fallback to first column
    }
    
    return csvRows.map((row) => {
      const rawVal = row[phoneIdx] || '';
      const parsed = parsePhoneNumber(rawVal, defaultPrefix);
      const url = parsed.isValid ? generateWhatsAppLink(parsed.sanitized, bulkMessage) : '';
      return {
        originalRow: row,
        rawPhone: rawVal,
        parsedPhone: parsed,
        whatsappLink: url,
      };
    });
  }, [csvHeaders, csvRows, bulkMessage, defaultPrefix]);

  // Bulk stats counters
  const bulkStats = useMemo(() => {
    const total = processedCsvData.length;
    const valid = processedCsvData.filter(item => item.parsedPhone.isValid).length;
    const invalid = total - valid;
    return { total, valid, invalid };
  }, [processedCsvData]);

  // Load recent links from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('wa_recent_links');
      if (stored) {
        setRecentLinks(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent links:', e);
    }
  }, []);

  // Save a single link to Recent Links list
  const handleSaveToHistory = () => {
    if (!generatedLink || !parsedPhone.isValid) return;

    const newLinkItem: RecentLink = {
      id: Date.now().toString(),
      phoneNumber: parsedPhone.displayFormatted,
      sanitizedNumber: parsedPhone.sanitized,
      message: customMessage.trim(),
      url: generatedLink,
      createdAt: new Date().toISOString(),
    };

    const filtered = recentLinks.filter(
      item => !(item.sanitizedNumber === newLinkItem.sanitizedNumber && item.message === newLinkItem.message)
    );
    
    const updated = [newLinkItem, ...filtered].slice(0, 5);
    
    setRecentLinks(updated);
    localStorage.setItem('wa_recent_links', JSON.stringify(updated));
  };

  // Copy link action with visual animation feedback
  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopiedLink(true);
    handleSaveToHistory();
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  // Open link in a new tab to test
  const handleTestLink = () => {
    if (!generatedLink) return;
    handleSaveToHistory();
    window.open(generatedLink, '_blank', 'noopener,noreferrer');
  };

  // Populate inputs when user clicks on a recent link
  const handleLoadRecentLink = (link: RecentLink) => {
    setRawPhoneNumber('+' + link.sanitizedNumber);
    setCustomMessage(link.message);
    setGeneratorMode('single');
    setActiveTab('link');
  };

  // Delete an individual link from history
  const handleDeleteRecentLink = (id: string) => {
    const updated = recentLinks.filter(item => item.id !== id);
    setRecentLinks(updated);
    localStorage.setItem('wa_recent_links', JSON.stringify(updated));
  };

  // Clear all recent links from history
  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear your generation history?')) {
      setRecentLinks([]);
      localStorage.removeItem('wa_recent_links');
    }
  };

  // --- CSV BULK LOGIC HANDLERS ---
  const processFile = (file: File) => {
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const parsed = parseCSV(text);
      setCsvHeaders(parsed.headers);
      setCsvRows(parsed.rows);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        processFile(file);
      } else {
        alert('Please upload a valid .csv spreadsheet file');
      }
    }
  };

  const handleResetBulk = () => {
    setCsvFileName('');
    setCsvHeaders([]);
    setCsvRows([]);
    setBulkMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadCSV = () => {
    if (processedCsvData.length === 0) return;
    
    const newHeaders = [...csvHeaders, 'whatsapp_link'];
    const csvLines = [
      newHeaders.map(h => `"${h.replace(/"/g, '""')}"`).join(',')
    ];
    
    processedCsvData.forEach(item => {
      const originalCellsFormatted = item.originalRow.map(cell => {
        const stringVal = String(cell || '');
        return `"${stringVal.replace(/"/g, '""')}"`;
      });
      originalCellsFormatted.push(`"${item.whatsappLink}"`);
      csvLines.push(originalCellsFormatted.join(','));
    });
    
    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const cleanBaseName = csvFileName.replace(/\.[^/.]+$/, "");
    link.setAttribute('download', `${cleanBaseName}_whatsapp_links.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSample = () => {
    const sampleHeaders = ['Name', 'Phone', 'Company'];
    const sampleRows = [
      ['Ahmed Shah', '+923001234567', 'Tech Corp'],
      ['Sarah Jenkins', '1-800-555-0199', 'Support Team'],
      ['John Doe', '03219876543', 'Sales Dept'],
      ['Invalid Record', 'not-a-number-123', 'None'],
    ];
    
    const csvLines = [
      sampleHeaders.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ];
    
    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'whatsapp_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#09090b] font-sans text-white selection:bg-emerald-500/30 selection:text-emerald-100 pb-16">
      {/* Decorative Subtle Radial Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40 h-[600px]" />

      {/* Header Container */}
      <header className="relative pt-12 pb-6 px-4 max-w-5xl mx-auto text-left space-y-3">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              WhatsApp <span className="text-emerald-500">Link Generator</span>
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mt-1.5 leading-relaxed">
              Create clean, high-converting WhatsApp chat links individually or in batch bulk sheets without backend servers.
            </p>
          </div>
        </div>
      </header>

      {/* Unified Tab Selector Segment */}
      <section className="relative max-w-5xl mx-auto px-4 mb-8">
        <div className="inline-flex bg-[#121214] border border-[#27272a] p-1 rounded-xl shadow-lg">
          <button
            type="button"
            onClick={() => setGeneratorMode('single')}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              generatorMode === 'single'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            Single Link Creator
          </button>
          <button
            type="button"
            onClick={() => setGeneratorMode('bulk')}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              generatorMode === 'bulk'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Bulk CSV Generator
            <span className="bg-emerald-950 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">New</span>
          </button>
        </div>
      </section>

      {/* Main Container */}
      <main className="relative max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* --- LEFT SIDE INPUT COLUMN --- */}
        <section className="md:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            
            {generatorMode === 'single' ? (
              // SINGLE GENERATOR CARD
              <motion.div
                key="single-generator"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 shadow-xl space-y-5"
              >
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#27272a] text-xs text-white font-bold">1</span>
                  Configure Link Destination
                </h2>

                {/* Phone input container */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Phone Number</span>
                    <span className="text-[11px] text-zinc-500 font-normal normal-case">Accepts spaces, dashes, parentheses & leading zero</span>
                  </label>

                  {/* Single Phone Number Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      value={rawPhoneNumber}
                      onChange={(e) => setRawPhoneNumber(e.target.value)}
                      placeholder="e.g., +92 300 1234567, 0300-1234567, or 1-800-555-0199"
                      className="w-full bg-[#18181b] border border-[#27272a] text-sm rounded-xl pl-10 pr-10 py-3.5 font-semibold tracking-wide text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                    {rawPhoneNumber && (
                      <button
                        type="button"
                        onClick={() => setRawPhoneNumber('')}
                        className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-white transition-colors"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>

                  {/* Fallback Prefix Selector */}
                  <div className="pt-2 pb-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        Default Country Prefix (Fallback)
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Prepend when '+' is omitted
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative flex items-center bg-[#141416] border border-[#27272a] rounded-xl px-3 py-1.5 max-w-[90px] focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
                        <span className="text-zinc-500 text-xs font-bold select-none">+</span>
                        <input
                          type="text"
                          value={defaultPrefix}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setDefaultPrefix(val);
                          }}
                          className="w-full bg-transparent text-xs font-bold text-white focus:outline-none pl-1"
                          placeholder="92"
                          maxLength={4}
                        />
                      </div>
                      
                      {/* Popular countries quick selector */}
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar max-w-full">
                        {COUNTRIES.slice(0, 5).map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => setDefaultPrefix(country.code)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                              defaultPrefix === country.code
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                                : 'bg-[#141416] border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                            }`}
                          >
                            <span>{country.flag}</span>
                            <span>{country.name.split(' ')[0]}</span>
                            <span className="text-zinc-500 font-mono text-[10px]">+{country.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Parser Validation Panel */}
                  {rawPhoneNumber && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        parsedPhone.isValid 
                          ? 'bg-[#064e3b]/10 border-emerald-950/40 text-emerald-400' 
                          : 'bg-amber-950/10 border-amber-950/40 text-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${parsedPhone.isValid ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                        <span className="font-medium">
                          Parsed Output: <strong className="font-mono text-white">{parsedPhone.displayFormatted}</strong>
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                        parsedPhone.isValid ? 'bg-emerald-950/40 text-emerald-300' : 'bg-amber-950/40 text-amber-300'
                      }`}>
                        {parsedPhone.isValid ? 'Ready to generate' : 'Incomplete'}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Pre-filled custom message textarea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Pre-filled Message (CTA)
                    </label>
                    <div className="text-xs text-zinc-600 font-mono">
                      {customMessage.length} characters
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Hi, I'm interested in your services! Please provide more details."
                      rows={6}
                      className="w-full bg-[#18181b] border border-[#27272a] text-sm rounded-xl p-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none leading-relaxed"
                    />
                    {customMessage && (
                      <button
                        type="button"
                        onClick={() => setCustomMessage('')}
                        className="absolute top-3.5 right-3 text-zinc-500 hover:text-white transition-colors"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              // BULK CSV GENERATOR CARD
              <motion.div
                key="bulk-generator"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 shadow-xl space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-4">
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#27272a] text-xs text-white font-bold">1</span>
                    Batch Upload Spreadsheet
                  </h2>
                  <button
                    type="button"
                    onClick={handleDownloadSample}
                    className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Download className="w-3 h-3" />
                    Download Sample CSV
                  </button>
                </div>

                {/* File Upload Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive 
                      ? 'border-emerald-500 bg-[#064e3b]/10' 
                      : csvFileName 
                      ? 'border-[#27272a] bg-[#1d1d21]/30' 
                      : 'border-[#27272a] hover:border-zinc-700 hover:bg-[#151518]'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                  />
                  
                  {!csvFileName ? (
                    <div className="flex flex-col items-center justify-center space-y-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-12 h-12 rounded-full bg-[#27272a] flex items-center justify-center text-zinc-400">
                        <Upload className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">Drag & Drop your .csv file here</p>
                        <p className="text-xs text-zinc-500 mt-1">or click to browse from device</p>
                      </div>
                      <div className="text-[10px] text-zinc-600 font-mono bg-[#1f1f23] px-2 py-1 rounded">
                        Accepts comma-separated values (.csv)
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#064e3b]/30 flex items-center justify-center text-emerald-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-400 truncate max-w-xs">{csvFileName}</p>
                        <p className="text-xs text-zinc-500 mt-1">{csvRows.length} contacts loaded successfully</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-[#27272a] hover:bg-[#323236] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Change File
                        </button>
                        <button
                          type="button"
                          onClick={handleResetBulk}
                          className="px-3 py-1.5 bg-red-950/30 hover:bg-red-950/60 text-red-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fallback Prefix Selector */}
                <div className="pt-2 pb-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      Default Country Prefix (Fallback)
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Prepend when '+' is omitted in sheet rows
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex items-center bg-[#141416] border border-[#27272a] rounded-xl px-3 py-1.5 max-w-[90px] focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
                      <span className="text-zinc-500 text-xs font-bold select-none">+</span>
                      <input
                        type="text"
                        value={defaultPrefix}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setDefaultPrefix(val);
                        }}
                        className="w-full bg-transparent text-xs font-bold text-white focus:outline-none pl-1"
                        placeholder="92"
                        maxLength={4}
                      />
                    </div>
                    
                    {/* Popular countries quick selector */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar max-w-full">
                      {COUNTRIES.slice(0, 5).map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => setDefaultPrefix(country.code)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                            defaultPrefix === country.code
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                              : 'bg-[#141416] border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                          }`}
                        >
                          <span>{country.flag}</span>
                          <span>{country.name.split(' ')[0]}</span>
                          <span className="text-zinc-500 font-mono text-[10px]">+{country.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Optional Uniform Message Area */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Uniform Pre-filled CTA Message <span className="text-[10px] text-zinc-500 font-normal normal-case">(Optional)</span>
                    </label>
                    <div className="text-xs text-zinc-600 font-mono">
                      {bulkMessage.length} characters
                    </div>
                  </div>
                  <textarea
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    placeholder="Hi, this is a batch message! (Leave blank to generate links with no pre-filled text)"
                    rows={4}
                    className="w-full bg-[#18181b] border border-[#27272a] text-sm rounded-xl p-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Preview Table of Loaded Spreadsheet Rows */}
                {csvRows.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-500" />
                        Preview (First 5 Rows)
                      </h3>
                      <span className="text-[10px] text-zinc-500">Auto-detected phone column</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#121214]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#18181b] border-b border-[#27272a] text-zinc-400 font-semibold">
                            <th className="p-3">Original Input</th>
                            <th className="p-3">Cleaned Number</th>
                            <th className="p-3 text-right">Link Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#212124]">
                          {processedCsvData.slice(0, 5).map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#18181b]/50">
                              <td className="p-3 font-mono text-zinc-400 max-w-[150px] truncate">{item.rawPhone || '(empty)'}</td>
                              <td className="p-3">
                                {item.parsedPhone.isValid ? (
                                  <span className="font-mono text-emerald-400 font-semibold">{item.parsedPhone.displayFormatted}</span>
                                ) : (
                                  <span className="text-amber-500 font-medium flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    Failed to parse
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {item.parsedPhone.isValid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 font-bold text-[9px] uppercase tracking-wide">
                                    <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                                    Valid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 font-bold text-[9px] uppercase tracking-wide">
                                    Invalid
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </section>

        {/* --- RIGHT SIDE OUTPUT COLUMN --- */}
        <section className="md:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            
            {generatorMode === 'single' ? (
              // SINGLE GENERATION OUTPUT CARD
              <motion.div
                key="single-output"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border-none rounded-[24px] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between min-h-[440px] text-zinc-900"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-zinc-400">
                      Generated Output
                    </h3>
                    <div className="status-pill bg-[#dcfce7] text-[#166534] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Link Active
                    </div>
                  </div>

                  <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveTab('link')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeTab === 'link' 
                          ? 'bg-white text-zinc-900 shadow-sm' 
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Link Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('qr')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeTab === 'qr' 
                          ? 'bg-white text-zinc-900 shadow-sm' 
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      QR Code Preview
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTab === 'link' ? (
                      <motion.div
                        key="link-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <div className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl p-4 min-h-36 flex flex-col justify-between font-mono text-xs text-zinc-600 break-all select-all leading-relaxed">
                          {generatedLink ? (
                            <div className="space-y-3">
                              <span className="text-[9px] font-bold text-emerald-700 tracking-wider uppercase block bg-emerald-100/50 w-fit px-2 py-0.5 rounded">
                                Standard WA.ME URL
                              </span>
                              <span className="text-zinc-800 font-semibold block select-all">
                                {generatedLink}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center py-6 h-full text-zinc-400 space-y-2">
                              <Phone className="w-8 h-8 text-zinc-300 stroke-[1.5]" />
                              <div>
                                <p className="font-semibold text-zinc-500">Awaiting phone number</p>
                                <p className="text-[10px] text-zinc-400 max-w-xs mt-0.5">Please fill out the destination phone number on the left to generate your custom WhatsApp link.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="qr-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <div className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl p-4 flex flex-col items-center justify-center min-h-36">
                          {generatedLink ? (
                            <div className="space-y-3 text-center flex flex-col items-center">
                              <div className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-sm">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generatedLink)}`}
                                  alt="Generated WhatsApp QR Code"
                                  referrerPolicy="no-referrer"
                                  className="w-36 h-36"
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-zinc-500 block">
                                Scan to instantly open WhatsApp chat
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center py-6 h-full text-zinc-400 space-y-2">
                              <QrCode className="w-8 h-8 text-zinc-300 stroke-[1.5]" />
                              <div>
                                <p className="font-semibold text-zinc-500">QR Code will appear here</p>
                                <p className="text-[10px] text-zinc-400 max-w-xs mt-0.5">Complete your configuration to download and print an interactive QR Code.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-3 mt-6">
                  <button
                    type="button"
                    disabled={!generatedLink}
                    onClick={handleCopyLink}
                    className={`w-full py-4 px-4 rounded-xl font-bold text-sm tracking-wide shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      !generatedLink
                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none'
                        : copiedLink
                        ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                        : 'bg-[#10b981] text-white hover:bg-[#059669] hover:shadow-lg hover:shadow-emerald-100 transition-all active:scale-[0.98]'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4.5 h-4.5 stroke-[3]" />
                        <span>Copied! Saved to History</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4.5 h-4.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={!generatedLink}
                    onClick={handleTestLink}
                    className={`w-full py-4 px-4 rounded-xl font-semibold text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      !generatedLink
                        ? 'border-zinc-200 text-zinc-300 cursor-not-allowed'
                        : 'border-[#e4e4e7] text-[#09090b] hover:bg-zinc-50 hover:border-zinc-300 active:bg-zinc-100'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4 text-zinc-500" />
                    <span>Open WhatsApp</span>
                  </button>

                  <div className="flex items-center gap-1.5 justify-center pt-2 text-[10px] text-zinc-400">
                    <Info className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Standard web-browser and mobile WhatsApp redirect protocols.</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              // BULK CSV ACTION CARD
              <motion.div
                key="bulk-output"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border-none rounded-[24px] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between min-h-[440px] text-zinc-900"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-zinc-400">
                      Processed File Summary
                    </h3>
                    <div className="status-pill bg-[#dcfce7] text-[#166534] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Client-Only
                    </div>
                  </div>

                  {/* Bulk stats display */}
                  {csvRows.length > 0 ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500 font-medium">Total Rows Loaded:</span>
                          <span className="font-bold font-mono text-zinc-900 bg-zinc-200 px-2 py-0.5 rounded">{bulkStats.total}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500 font-medium">Valid Phone Numbers:</span>
                          <span className="font-bold font-mono text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded">{bulkStats.valid}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500 font-medium">Invalid or Unparsed:</span>
                          <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                            bulkStats.invalid > 0 ? 'text-amber-700 bg-amber-100/50' : 'text-zinc-500 bg-zinc-200'
                          }`}>{bulkStats.invalid}</span>
                        </div>
                      </div>

                      {bulkStats.invalid > 0 && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-800 leading-relaxed">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            Some rows failed standard phone criteria. They will still be exported, but with empty or unparseable URLs.
                          </span>
                        </div>
                      )}

                      <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 leading-relaxed">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          Standard <strong>whatsapp_link</strong> column will be dynamically added as the final column of your downloaded sheet.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-12 text-zinc-400 space-y-3">
                      <FileText className="w-12 h-12 text-zinc-300 stroke-[1.5]" />
                      <div>
                        <p className="font-bold text-zinc-500 text-sm">No spreadsheet active</p>
                        <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                          Please drop or choose your <strong>.csv file</strong> in the configurator on the left to activate bulk batch link generation.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-6">
                  {/* Download Action */}
                  <button
                    type="button"
                    disabled={processedCsvData.length === 0}
                    onClick={handleDownloadCSV}
                    className={`w-full py-4 px-4 rounded-xl font-bold text-sm tracking-wide shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      processedCsvData.length === 0
                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg active:scale-[0.98]'
                    }`}
                  >
                    <Download className="w-4.5 h-4.5" />
                    <span>Download Processed CSV</span>
                  </button>

                  <button
                    type="button"
                    disabled={processedCsvData.length === 0}
                    onClick={handleResetBulk}
                    className={`w-full py-4 px-4 rounded-xl font-semibold text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      processedCsvData.length === 0
                        ? 'border-zinc-200 text-zinc-300 cursor-not-allowed'
                        : 'border-[#e4e4e7] text-[#09090b] hover:bg-zinc-50 hover:border-zinc-300 active:bg-zinc-100'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4 text-zinc-500" />
                    <span>Reset Sheet</span>
                  </button>

                  <div className="flex items-center gap-1.5 justify-center pt-2 text-[10px] text-zinc-400">
                    <Info className="w-3.5 h-3.5 text-zinc-400" />
                    <span>100% secure client-side processor. No server uploads.</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </section>

      </main>

      {/* History and Recent list (Full width layout at bottom) */}
      <footer className="max-w-5xl mx-auto px-4 mt-8">
        <RecentLinksList
          links={recentLinks}
          onLoad={handleLoadRecentLink}
          onDelete={handleDeleteRecentLink}
          onClearAll={handleClearAllHistory}
        />
      </footer>
    </div>
  );
}
