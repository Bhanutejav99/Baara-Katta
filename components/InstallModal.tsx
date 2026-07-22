import React from 'react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallClick: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallClick,
}) => {
  if (!isOpen) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#2a1b15] to-[#150a08] border-2 border-[#b45309] rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-center overflow-hidden">
        
        {/* Decorative Gold Header Ribbon */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full opacity-20 blur-xl pointer-events-none"></div>

        {/* App Logo Emblem */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 border-2 border-amber-300 shadow-xl flex items-center justify-center text-3xl animate-bounce">
          🎲
        </div>

        <h3 className="text-xl font-display font-bold text-amber-100 uppercase tracking-wider mb-1">
          Install Royal Edition App
        </h3>
        <p className="text-xs text-amber-300/80 mb-5">
          Get zero-latency offline play, full-screen gaming, and fast launch from your Home Screen!
        </p>

        {deferredPrompt ? (
          /* Native 1-Click PWA Install Button */
          <div className="flex flex-col gap-3">
            <button
              onClick={onInstallClick}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-display font-bold text-sm uppercase tracking-widest rounded-2xl shadow-xl border border-amber-300 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>📲</span>
              <span>Install App Now</span>
            </button>
          </div>
        ) : isIOS ? (
          /* iOS Safari Add to Home Screen Instructions */
          <div className="bg-black/60 border border-amber-500/30 rounded-2xl p-4 text-left text-xs text-amber-200/90 space-y-2 mb-4">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>🍏</span> iOS Safari Instructions:
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-amber-100/80">
              <li>Tap the <span className="font-bold text-amber-300">Share button</span> (square with arrow up) in Safari.</li>
              <li>Scroll down and tap <span className="font-bold text-amber-300">"Add to Home Screen"</span>.</li>
              <li>Tap <span className="font-bold text-amber-300">"Add"</span> in top right corner.</li>
            </ol>
          </div>
        ) : (
          /* Desktop / General Download Instructions */
          <div className="bg-black/60 border border-amber-500/30 rounded-2xl p-4 text-left text-xs text-amber-200/90 space-y-2 mb-4">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>💻</span> Web App Features Ready:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-100/80">
              <li>Click the install icon in your browser address bar.</li>
              <li>Enjoy 100% offline gameplay & fast responsive controls.</li>
            </ul>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 bg-gray-900/80 hover:bg-gray-800 text-gray-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors border border-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};
