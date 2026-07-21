import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = React.useState<'BASIC' | 'SHELLS' | 'BOARDS' | 'STRATEGY'>('BASIC');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#1a0f0d] border-2 border-[#5d4037] rounded-[2rem] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 bg-[#2a1b15] border-b border-[#5d4037] flex justify-between items-center relative">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-amber-200">
              📜 Royal Archives & Rules
            </h2>
            <p className="text-xs text-amber-600 uppercase tracking-widest font-bold mt-1">
              Ancient Strategy of Ashta Chamma & Baara Katta
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/40 border border-amber-500/30 text-amber-400 text-xl font-bold flex items-center justify-center hover:bg-amber-500 hover:text-black transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#5d4037] bg-black/20 text-xs md:text-sm font-bold uppercase tracking-wider">
          <button 
            onClick={() => setActiveTab('BASIC')}
            className={`flex-1 py-3 px-2 text-center transition-colors border-b-2 ${activeTab === 'BASIC' ? 'border-amber-400 text-amber-400 bg-amber-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            1. Objective
          </button>
          <button 
            onClick={() => setActiveTab('SHELLS')}
            className={`flex-1 py-3 px-2 text-center transition-colors border-b-2 ${activeTab === 'SHELLS' ? 'border-amber-400 text-amber-400 bg-amber-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            2. Shell Dice
          </button>
          <button 
            onClick={() => setActiveTab('BOARDS')}
            className={`flex-1 py-3 px-2 text-center transition-colors border-b-2 ${activeTab === 'BOARDS' ? 'border-amber-400 text-amber-400 bg-amber-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            3. Battlefields
          </button>
          <button 
            onClick={() => setActiveTab('STRATEGY')}
            className={`flex-1 py-3 px-2 text-center transition-colors border-b-2 ${activeTab === 'STRATEGY' ? 'border-amber-400 text-amber-400 bg-amber-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            4. Royal Tactics
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-gray-300 leading-relaxed scrollbar-thin">
          
          {activeTab === 'BASIC' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl">
                <h3 className="text-lg font-bold text-amber-300 mb-1 font-display">👑 Ultimate Goal</h3>
                <p>
                  Race all 4 of your royal pawns from your Home Tray into the central Goal cell (the Lotus Center). The first player to bring all 4 pawns home wins the throne!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-black/40 rounded-xl border border-[#5d4037]">
                  <div className="text-amber-400 font-bold mb-1 text-base">🚪 Board Entry Requirement</div>
                  <p className="text-xs text-gray-400">
                    Pawns start in your Home Tray. They can ONLY enter the starting square if you roll a bonus entry number (<strong>4 or 8</strong> in 5x5; <strong>6 or 12</strong> in 7x7).
                  </p>
                </div>
                <div className="p-4 bg-black/40 rounded-xl border border-[#5d4037]">
                  <div className="text-amber-400 font-bold mb-1 text-base">⚔️ Royal Capture Mandate</div>
                  <p className="text-xs text-gray-400">
                    To enter the inner ring towards the victory center, your kingdom MUST capture at least one opponent pawn during the game!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SHELLS' && (
            <div className="space-y-4">
              <p>
                Traditional Cowrie Shells determine how far your pawns travel. The score depends on how many shells fall with their open mouth facing up:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#2a1b15] rounded-2xl border border-amber-500/30">
                  <h4 className="font-bold text-amber-300 text-base mb-2">🐚 5x5 Ashta Chamma (4 Shells)</h4>
                  <ul className="space-y-1.5 text-xs">
                    <li>• <strong>0 Open:</strong> 🌟 Ashta (8) + Bonus Roll! (Enters Home)</li>
                    <li>• <strong>1 Open:</strong> 1 Step</li>
                    <li>• <strong>2 Open:</strong> 2 Steps</li>
                    <li>• <strong>3 Open:</strong> 3 Steps</li>
                    <li>• <strong>4 Open:</strong> ✨ Chowka (4) + Bonus Roll! (Enters Home)</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#2a1b15] rounded-2xl border border-amber-500/30">
                  <h4 className="font-bold text-amber-300 text-base mb-2">🐚 7x7 Baara Katta (6 Shells)</h4>
                  <ul className="space-y-1.5 text-xs">
                    <li>• <strong>0 Open:</strong> 🌟 Baara (12) + Bonus Roll! (Enters Home)</li>
                    <li>• <strong>1-5 Open:</strong> 1-5 Steps</li>
                    <li>• <strong>6 Open:</strong> ✨ Katta (6) + Bonus Roll! (Enters Home)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-900/20 p-3 rounded-xl border border-amber-500/20 text-xs text-amber-200">
                <strong>💡 Extra Turn Rule:</strong> Rolling a bonus number (4/8 or 6/12) OR capturing an opponent gives you an immediate extra dice roll!
              </div>
            </div>
          )}

          {activeTab === 'BOARDS' && (
            <div className="space-y-4">
              <div className="p-4 bg-black/40 rounded-2xl border border-[#5d4037]">
                <h4 className="font-bold text-amber-400 text-base mb-2">🛡️ Safe Squares (Marked Cells)</h4>
                <p className="text-xs text-gray-300">
                  Cells with cross/lotus markings are Safe Havens. Pawns resting on Safe Havens CANNOT be captured by opponents. Multiple players can safely co-exist on a safe square.
                </p>
              </div>

              <div className="p-4 bg-black/40 rounded-2xl border border-[#5d4037]">
                <h4 className="font-bold text-amber-400 text-base mb-2">🛑 Gatti / Blockades (5x5 Grid)</h4>
                <p className="text-xs text-gray-300">
                  In 5x5 games, placing 2 or more of your active pawns on an UNSAFE tile creates a solid <strong>Blockade (Gatti)</strong>. Opponent pawns cannot leap over or land on your blockade!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'STRATEGY' && (
            <div className="space-y-3">
              <div className="flex gap-3 items-start p-3 bg-black/30 rounded-xl border border-[#5d4037]">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="font-bold text-amber-300">Hunt Early for the Pass</div>
                  <p className="text-xs text-gray-400">Secure a capture early in the outer track so your pawns aren't blocked from advancing into the inner track when approaching the goal.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-black/30 rounded-xl border border-[#5d4037]">
                <span className="text-2xl">🛡️</span>
                <div>
                  <div className="font-bold text-amber-300">Leap Between Safe Havens</div>
                  <p className="text-xs text-gray-400">Plan your moves to land directly on safe squares, avoiding vulnerable open tiles where enemy pawns are lurking behind you.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-black/30 rounded-xl border border-[#5d4037]">
                <span className="text-2xl">🧱</span>
                <div>
                  <div className="font-bold text-amber-300">Build Wall Blockades</div>
                  <p className="text-xs text-gray-400">In 5x5 mode, double up your pawns to block narrow pathways and trap opposing armies!</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#2a1b15] border-t border-[#5d4037] flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-xs uppercase tracking-wider"
          >
            I am Ready for Battle
          </button>
        </div>

      </div>
    </div>
  );
};
