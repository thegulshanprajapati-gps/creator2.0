'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Timer, Lock, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SessionTimeout() {
  // 15 minutes = 900 seconds
  const [timeLeft, setTimeLeft] = useState<number>(900);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);

  // Check login session & handle countdown
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if session exists
    const sessionStr = localStorage.getItem('xmarty_session');
    if (!sessionStr) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleLogout();
          return 0;
        }
        const nextTime = prev - 1;
        // Show popup if remaining time is 60 seconds or less
        if (nextTime <= 60) {
          setShowPopup(true);
        } else {
          setShowPopup(false);
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Find Portal Target inside Header
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateTarget = () => {
      const header = document.querySelector('header');
      if (header) {
        // Try to find the right-side actions div inside the header
        const rightContainer = header.querySelector('div.flex-1 div.flex.items-center.gap-3') || 
                               header.querySelector('div.flex.items-center.gap-3:last-child') || 
                               header;
        setPortalTarget(rightContainer);
      } else {
        setPortalTarget(null);
      }
    };

    updateTarget();

    const observer = new MutationObserver(updateTarget);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('xmarty_session');
    window.location.href = '/login';
  };

  const addTime = (minutes: number) => {
    setTimeLeft((prev) => {
      const newTime = prev + minutes * 60;
      if (newTime > 60) {
        setShowPopup(false);
      }
      return newTime;
    });
  };

  const subtractTime = (minutes: number) => {
    setTimeLeft((prev) => {
      const newTime = Math.max(0, prev - minutes * 60);
      if (newTime <= 60) {
        setShowPopup(true);
      }
      return newTime;
    });
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render the header widget
  const renderHeaderWidget = () => {
    return (
      <div className="flex items-center gap-2 md:gap-3 bg-neutral-950 border border-neutral-800 text-neutral-200 px-3 py-1.5 rounded-full font-mono text-[12px] md:text-sm tracking-tight shadow-lg select-none">
        <Clock className="h-3.5 w-3.5 text-neutral-400 animate-pulse" />
        <span className="font-bold text-white tracking-wider">{formatTime(timeLeft)}</span>
        <span className="text-neutral-700">|</span>
        <button
          onClick={() => subtractTime(1)}
          className="hover:text-red-400 font-bold transition-colors duration-200 px-1"
          title="Subtract 1 Minute"
        >
          -1M
        </button>
        <span className="text-neutral-700">|</span>
        <button
          onClick={() => addTime(5)}
          className="hover:text-emerald-400 font-bold transition-colors duration-200 px-1"
          title="Add 5 Minutes"
        >
          +5M
        </button>
        <span className="text-neutral-700">|</span>
        <Timer className="h-3.5 w-3.5 text-neutral-400" />
      </div>
    );
  };

  return (
    <>
      {/* Portaled Header Widget */}
      {portalTarget && createPortal(renderHeaderWidget(), portalTarget)}

      {/* Security Timeout Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0D0D0D] border border-red-500/20 rounded-[2rem] p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Shield/Lock Icon Container */}
            <div className="w-16 h-16 rounded-2xl bg-red-950/30 border border-red-500/30 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 rounded-2xl bg-red-500/5 animate-pulse" />
              <Lock className="h-7 w-7 text-red-500" />
            </div>

            {/* Headers */}
            <h2 className="text-xl md:text-2xl font-black tracking-widest text-[#FF1E27] font-headline text-center uppercase">
              Security Timeout
            </h2>
            <p className="text-[10px] tracking-[0.2em] font-bold text-neutral-500 mt-1 uppercase text-center">
              Active Protocol Shield
            </p>

            {/* Large Timer Display */}
            <div className="my-8 text-5xl md:text-6xl font-black font-mono tracking-wider text-white">
              {formatTime(timeLeft)}
            </div>

            <p className="text-xs text-neutral-400 text-center mb-8 font-medium">
              This administrative console will automatically terminate.
            </p>

            {/* Interactive Add Time Buttons */}
            <div className="grid grid-cols-3 gap-3 w-full mb-6">
              <button
                onClick={() => addTime(2)}
                className="py-3 px-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-white font-bold text-xs md:text-sm transition-all duration-200 hover:scale-[1.02]"
              >
                +2 MIN
              </button>
              <button
                onClick={() => addTime(5)}
                className="py-3 px-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-white font-bold text-xs md:text-sm transition-all duration-200 hover:scale-[1.02]"
              >
                +5 MIN
              </button>
              <button
                onClick={() => addTime(10)}
                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-red-600/20"
              >
                +10 MIN
              </button>
            </div>

            {/* Terminate Session Button */}
            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-neutral-300 hover:text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              TERMINATE SESSION & LOGOUT
            </button>
          </div>
        </div>
      )}
    </>
  );
}
