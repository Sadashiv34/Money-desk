import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone display mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standaloneMode);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isAppleMobile);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <>
      <div className="bg-zinc-900/90 border border-zinc-800 backdrop-blur-md rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-lg mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="font-semibold text-zinc-200">Install MoneyDesk App</p>
            <p className="text-zinc-400 truncate">Add to Home Screen for 1-tap quick transaction logging</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-md transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-zinc-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-semibold text-base text-zinc-100 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                Add to iPhone / iPad Home Screen
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong className="text-white">Share</strong> button (box with upward arrow) at the bottom of Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down the action sheet and select <strong className="text-white">Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Tap <strong className="text-emerald-400">Add</strong> in the top-right corner to place MoneyDesk on your screen.
                </span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-6 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium rounded-xl text-sm transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
