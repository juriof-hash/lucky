/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PartyPopper, Sparkles, Pencil } from 'lucide-react';

const PASTEL_COLORS = [
  '#FFB5E8', // Soft Pink
  '#85E3FF', // Sky Blue
  '#BFFCC6', // Mint
  '#FFF5BA', // Butter Yellow
  '#B28DFF', // Lavender
  '#FFC9DE', // Light Pink
  '#FCE2C6', // Apricot
  '#A2E1DB', // Aqua
  '#F3B0E8', // Orchid
  '#97A2FF', // Periwinkle
  '#FFCCB6', // Peach
  '#E2C6FF'  // Lilac
];

export default function App() {
  const [numSegments, setNumSegments] = useState(6);
  const [labels, setLabels] = useState<string[]>(
    Array.from({ length: 6 }, (_, i) => `항목 ${i + 1}`)
  );
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  
  // Custom Edit Modal State
  const [editingInfo, setEditingInfo] = useState<{index: number, text: string} | null>(null);

  const handleNumChange = (newNum: number) => {
    const n = Math.max(2, Math.min(12, newNum));
    setNumSegments(n);
    setLabels((prev) => {
      const next = [...prev];
      while (next.length < n) next.push(`항목 ${next.length + 1}`);
      return next.slice(0, n);
    });
  };

  const handleLabelChange = (index: number, text: string) => {
    setLabels((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const spin = () => {
    setIsSpinning(true);
    setWinner(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Audio effect for spinning
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const createTick = (time: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, time);
        osc.frequency.exponentialRampToValueAtTime(400, time + 0.05);
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.2, time + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        osc.start(time);
        osc.stop(time + 0.05);
      };

      let t = audioCtx.currentTime;
      let delay = 0.03;
      // Schedule clicks simulating slow down
      while (t < audioCtx.currentTime + 3.1) {
        createTick(t);
        t += delay;
        delay = delay * 1.07;
      }
    } catch (e) {
      console.log('Audio not supported', e);
    }

    // Spin between 6 and 10 extra full rotations
    const extraSpins = 360 * (6 + Math.floor(Math.random() * 5));
    // Pick a targeted exact final angle randomly
    const randomTarget = Math.floor(Math.random() * 360);
    const nextRotation = rotationRef.current + extraSpins + randomTarget;
    rotationRef.current = nextRotation;

    setRotation(nextRotation);

    // Wait for the ~3 second animation to conclude before showing modal
    timeoutRef.current = setTimeout(() => {
      setIsSpinning(false);
      
      // Play winning tada sound
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const playNote = (freq: number, startTime: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        
        const now = audioCtx.currentTime;
        playNote(523.25, now, 0.15); // C5
        playNote(659.25, now + 0.15, 0.15); // E5
        playNote(783.99, now + 0.3, 0.4); // G5
        playNote(1046.50, now + 0.45, 0.6); // C6
      } catch (e) {
        console.log('Audio not supported', e);
      }

      const normalizedR = nextRotation % 360;
      
      // Calculate which angle is pointing to the absolute physical TOP (0 degrees)
      const topAngle = (360 - normalizedR) % 360;
      const sliceAngle = 360 / numSegments;
      
      // Determine the precise winning segment mapped from the target
      const winnerIndex = Math.round(topAngle / sliceAngle) % numSegments;
      setWinner(labels[winnerIndex]);
    }, 3200);
  };

  // Generate strict conic gradient stopping angles relative to drawing orientation
  const conicBackground = labels
    .map((_, i) => {
      const start = i * (360 / numSegments);
      const end = start + 360 / numSegments;
      return `${PASTEL_COLORS[i % PASTEL_COLORS.length]} ${start}deg ${end}deg`;
    })
    .join(', ');

  const halfSlice = (360 / numSegments) / 2;

  // Use this ref to focus edit input
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editingInfo) {
      inputRef.current?.focus();
    }
  }, [editingInfo]);

  return (
    <div className="min-h-screen bg-[#F0F4FA] flex items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden">
      {/* Decorative Blob Backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-5xl bg-white/60 backdrop-blur-2xl p-6 sm:p-12 rounded-[2.5rem] shadow-xl border border-white flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start z-10 mx-auto">
        
        {/* Main Wheel Area */}
        <div className="flex-shrink-0 relative flex flex-col items-center">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-pink-400 shrink-0" />
              돌려돌려 돌림판
            </h1>
            <p className="text-slate-500 font-medium mt-2">화면을 쓸어넘기거나 중앙의 버튼을 눌러 시작해보세요!<br/>항목을 <b>클릭</b>하면 이름을 바꿀 수 있습니다.</p>
          </div>

          {/* Wheel Frame */}
          <div className="relative w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] rounded-full drop-shadow-2xl border-8 border-white bg-white/50 p-2 lg:mb-8">
            
            {/* Pointer SVG overlay - Absolute Top Dead Center */}
            <div className="absolute -top-[22px] left-1/2 -translate-x-1/2 z-30 drop-shadow-lg pointer-events-none">
              <svg width="46" height="56" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 48L0 0H40L20 48Z" fill="#F43F5E"/>
                <path d="M20 42L4 3H36L20 42Z" fill="#FDA4AF"/>
              </svg>
            </div>

            {/* Rotary Action Div */}
            <motion.div
              className={`w-full h-full rounded-full relative overflow-hidden border-4 border-white/60 shadow-inner ${isSpinning ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{
                background: `conic-gradient(from -${halfSlice}deg, ${conicBackground})`,
                touchAction: 'none' // Prevents scrolling on mobile so swiping works reliably
              }}
              animate={{ rotate: rotation }}
              transition={{ duration: 3.2, ease: [0.1, 0.8, 0.1, 1] }}
              whileTap={{ scale: 0.995 }}
              onPanEnd={(e, info) => {
                const velocity = Math.hypot(info.velocity.x, info.velocity.y);
                if (velocity > 200) {
                  spin();
                }
              }}
            >
              {/* Internal Separator Lines */}
              {labels.map((_, i) => {
                const angle = i * (360 / numSegments) + halfSlice;
                return (
                  <div key={`line-${i}`} className="absolute inset-0 pointer-events-none" style={{ transform: `rotate(${angle}deg)` }}>
                    <div className="mx-auto w-[2px] h-[50%] bg-white/50" />
                  </div>
                );
              })}

              {/* Segment Labels */}
              {labels.map((l, i) => {
                const angle = i * (360 / numSegments);
                return (
                  <div key={`label-${i}`} className="absolute inset-0 pointer-events-none" style={{ transform: `rotate(${angle}deg)` }}>
                    <div 
                      className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 flex items-start justify-center pt-2"
                      style={{ width: `${800 / numSegments}px` }}
                    >
                      <button 
                        onPointerDown={(e) => e.stopPropagation()} // Prevent pan gesture from cancelling click
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSpinning) {
                            setEditingInfo({index: i, text: l});
                          }
                        }}
                        className="pointer-events-auto flex items-center justify-center gap-1 max-w-[80%] text-xs sm:text-[15px] font-black text-slate-700/90 tracking-wide px-2 py-1 rounded-lg hover:bg-white/40 transition-colors bg-white/20 backdrop-blur-sm cursor-pointer hover:scale-105 active:scale-95"
                        disabled={isSpinning}
                      >
                        <span className="truncate max-w-full drop-shadow-md pb-[1px]">{l}</span>
                        <Pencil className="w-3 h-3 opacity-60 flex-shrink-0 drop-shadow-md" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
            
            {/* Center Stud / Spin Button */}
            <button
              onClick={spin}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 group border-4 border-transparent hover:border-pink-50 ${isSpinning ? 'opacity-90' : ''}`}
            >
              <div className="w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] rounded-full border-4 border-pink-100 flex items-center justify-center bg-gradient-to-b from-white to-pink-50 text-pink-500 font-black text-lg sm:text-xl tracking-wider group-hover:from-pink-50 group-hover:to-pink-100 transition-colors shadow-inner">
                시작
              </div>
            </button>
          </div>
        </div>

        {/* Configuration Panel Area */}
        <div className="w-full flex-1 flex flex-col gap-6 bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl border border-slate-100 h-[600px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider block">
                선택지 개수
              </label>
              <span className="font-black text-xl text-pink-500 bg-pink-50 px-3 py-1 rounded-xl">
                {numSegments}
              </span>
            </div>
            <input 
              type="range" 
              min={2} 
              max={12} 
              value={numSegments} 
              disabled={isSpinning}
              onChange={(e) => handleNumChange(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pink-500 disabled:opacity-50"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scroll">
            {labels.map((l, i) => (
              <div key={i} className="flex items-center gap-4 bg-slate-50/50 p-2 rounded-2xl border border-slate-100/80 focus-within:border-pink-200 transition-colors">
                <span 
                  className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm"
                  style={{ backgroundColor: PASTEL_COLORS[i % PASTEL_COLORS.length], color: '#334155' }}
                >
                  {i + 1}
                </span>
                <input 
                  type="text" 
                  value={l} 
                  disabled={isSpinning}
                  onChange={(e) => handleLabelChange(i, e.target.value)} 
                  className="flex-1 w-full bg-transparent border-none focus:outline-none font-semibold text-slate-700 placeholder-slate-300 disabled:opacity-50 py-1"
                  placeholder={`항목 ${i + 1}`}
                  maxLength={24}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editing Modal */}
      <AnimatePresence>
        {editingInfo !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setEditingInfo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-slate-800 mb-4">항목 이름 변경</h3>
              <input
                ref={inputRef}
                type="text"
                value={editingInfo.text}
                onChange={(e) => setEditingInfo({ ...editingInfo, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLabelChange(editingInfo.index, editingInfo.text);
                    setEditingInfo(null);
                  }
                }}
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-pink-400 focus:bg-white transition-all rounded-xl px-4 py-3 text-slate-700 font-bold mb-6 outline-none shadow-inner"
                placeholder="항목을 입력하세요"
                maxLength={24}
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingInfo(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={() => {
                    handleLabelChange(editingInfo.index, editingInfo.text);
                    setEditingInfo(null);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Celebration Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setWinner(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl flex flex-col items-center max-w-sm w-full border-4 border-white/80"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <PartyPopper className="w-10 h-10" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-3 tracking-tight text-center">
                당첨!
              </h2>
              
              <div className="text-xl sm:text-2xl font-bold text-slate-600 bg-slate-50 px-6 py-5 rounded-[1.5rem] w-full text-center border-2 border-slate-100 shadow-inner mb-8 break-words">
                {winner}
              </div>
              
              <button 
                onClick={() => setWinner(null)}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold text-lg rounded-2xl hover:from-pink-600 hover:to-rose-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-pink-200"
              >
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

