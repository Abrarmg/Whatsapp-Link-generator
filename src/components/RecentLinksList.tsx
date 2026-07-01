/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { RecentLink } from '../types';
import { 
  History, 
  Copy, 
  Check, 
  ArrowUpRight, 
  Trash2, 
  MessageSquare, 
  Phone, 
  ExternalLink 
} from 'lucide-react';

interface RecentLinksListProps {
  links: RecentLink[];
  onLoad: (link: RecentLink) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function RecentLinksList({ links, onLoad, onDelete, onClearAll }: RecentLinksListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (link: RecentLink) => {
    navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  if (links.length === 0) {
    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-8 text-center shadow-lg" id="recent-links-empty">
        <div className="w-12 h-12 bg-[#27272a] border border-[#3f3f46] rounded-xl flex items-center justify-center mx-auto mb-3">
          <History className="w-5 h-5 text-zinc-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200">No recent links yet</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Generate a link above, and it will be saved in your offline history for quick access later.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 space-y-4 shadow-xl" id="recent-links-container">
      <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#27272a] rounded-lg">
            <History className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Recently Generated Links</h3>
            <p className="text-xs text-zinc-500">Quickly reuse or copy your last few setups</p>
          </div>
        </div>
        
        <button
          onClick={onClearAll}
          type="button"
          className="text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          Clear History
        </button>
      </div>

      <div className="divide-y divide-[#27272a] max-h-96 overflow-y-auto pr-1">
        {links.map((link) => (
          <div key={link.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-100 bg-[#27272a] px-2.5 py-1 rounded-full">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  {link.phoneNumber}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {new Date(link.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              {link.message ? (
                <p className="text-xs text-zinc-300 flex items-start gap-1.5 line-clamp-1 italic">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                  "{link.message}"
                </p>
              ) : (
                <p className="text-xs text-zinc-500 flex items-center gap-1.5 italic">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  No pre-filled message
                </p>
              )}

              <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 truncate max-w-full">
                <span className="bg-[#064e3b]/10 border border-emerald-950/40 px-2 py-0.5 rounded text-ellipsis overflow-hidden block">
                  {link.url}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {/* Load Button */}
              <button
                onClick={() => onLoad(link)}
                title="Load into Editor"
                className="p-2 text-zinc-300 hover:text-emerald-400 hover:bg-[#064e3b]/20 border border-[#27272a] hover:border-emerald-800 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-medium"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Load</span>
              </button>

              {/* Copy Button */}
              <button
                onClick={() => handleCopy(link)}
                title="Copy Link"
                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-xs font-medium ${
                  copiedId === link.id
                    ? 'bg-[#10b981] text-white border-[#10b981]'
                    : 'bg-transparent text-zinc-300 hover:text-emerald-400 hover:bg-[#064e3b]/20 border border-[#27272a] hover:border-emerald-800'
                }`}
              >
                {copiedId === link.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* External Test Button */}
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                title="Open WhatsApp"
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a] border border-[#27272a] rounded-lg transition-all"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Delete Button */}
              <button
                onClick={() => onDelete(link.id)}
                title="Delete from History"
                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-950/20 rounded-lg transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
