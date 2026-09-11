'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
  onClearKey: () => void;
  isLiveSyncActive: boolean;
}

export default function GoogleMapsSyncModal({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
  onClearKey,
  isLiveSyncActive,
}: Props) {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setStatusMessage('Please enter a valid Google Maps API Key.');
      setTestStatus('error');
      return;
    }

    setTestStatus('testing');
    setStatusMessage('Testing connection to Google Places API...');

    try {
      // Test the key against /api/places with test coordinates (Central Singapore)
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: 1.2838, // Marina Bay / Central
          lng: 103.8591,
          radius: 600,
          clientKey: trimmed,
        }),
      });

      const data = await res.json();

      if (res.ok && data.places) {
        setTestStatus('success');
        setStatusMessage(`Connected successfully! Found ${data.count} live places from ${data.source}.`);
        onSaveKey(trimmed);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setTestStatus('error');
        setStatusMessage(
          data.message || 'Failed to authenticate with Google Places. Please check your API key permissions.'
        );
      }
    } catch (err: any) {
      setTestStatus('error');
      setStatusMessage(err?.message || 'Network error connecting to API.');
    }
  };

  const handleClear = () => {
    setInputKey('');
    setTestStatus('idle');
    setStatusMessage('');
    onClearKey();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#243324]/10 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-[#243324]/10 flex items-start justify-between bg-[#FBF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-lg text-[#243324]">
                Google Maps Live Sync
              </h3>
              <p className="text-xs text-[#5C695C]">
                Fetch real-time businesses, restaurants, cafes & shops
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5C695C] hover:bg-[#243324]/5 hover:text-[#243324] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs text-[#243324]">
          {/* Status Banner */}
          {isLiveSyncActive ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Live Sync is Active</span>
                <p className="text-[11px] text-emerald-700">
                  Every selected pin & radius queries Google Places API for up-to-date amenities.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Built-in SG Dataset Active</span>
                <p className="text-[11px] text-amber-800">
                  You are currently using verified Singapore official datasets (160+ MRT stations, bus stops, primary schools, hawkers, supermarkets, clinics). Connect your Google Places key to stream real-time Google Maps listings.
                </p>
              </div>
            </div>
          )}

          {/* Key Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-xs text-[#243324] flex items-center justify-between">
              <span>Google Places API Key:</span>
              <a
                href="https://console.cloud.google.com/apis/library/places.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-medium"
              >
                <span>Get API Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="relative flex items-center">
              <Key className="w-4 h-4 text-[#5C695C] absolute left-3 pointer-events-none" />
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setTestStatus('idle');
                }}
                placeholder="AIzaSy..."
                className="w-full pl-9 pr-16 py-2.5 bg-[#FBF9F5] rounded-xl border border-[#243324]/20 text-xs font-mono text-[#243324] placeholder-[#5C695C]/60 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-[#5C695C] hover:text-[#243324]"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#5C695C]">
              Your key is stored only locally in your browser (<code className="bg-[#243324]/5 px-1 py-0.5 rounded text-[10px]">localStorage</code>) and proxied through our secure Next.js server endpoint.
            </p>
          </div>

          {/* Test Feedback */}
          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
                testStatus === 'testing'
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : testStatus === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testStatus === 'testing' && (
                <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
              )}
              {testStatus === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {testStatus === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{statusMessage}</span>
            </div>
          )}

          {/* Instructions Guide */}
          <div className="p-3 bg-[#F4EFE6]/60 rounded-xl border border-[#243324]/10 space-y-1.5 text-[11px] text-[#5C695C]">
            <span className="font-bold text-[#243324]">Quick Setup (3 steps):</span>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open Google Cloud Console and create or select a project.</li>
              <li>Enable <strong>Places API (New)</strong> or <strong>Places API</strong>.</li>
              <li>Create an API key under <strong>Credentials</strong> and paste it above.</li>
            </ol>
            <p className="text-[10px] text-slate-500 italic mt-1">
              Google provides $200 free monthly usage credits for every Cloud account.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FBF9F5] border-t border-[#243324]/10 flex items-center justify-between">
          <div>
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Key</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#5C695C] hover:text-[#243324] hover:bg-[#243324]/5 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTestAndSave}
              disabled={testStatus === 'testing'}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {testStatus === 'testing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save & Connect</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
