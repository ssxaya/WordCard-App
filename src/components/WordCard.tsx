
import React, { useState, useRef, useEffect } from "react";
import { Word } from "@/types/word";
import { themeConfig } from "@/config/theme";
import { Settings, Volume2, Sun, Moon, Palette } from "lucide-react";

interface WordCardProps {
  word: Word;
  onNext: () => void;
  onPrev: () => void;
  onIndexChange: (index: number) => void;
  currentIndex: number;
  total: number;
}

const WordCard: React.FC<WordCardProps> = ({ word, onNext, onPrev, onIndexChange, currentIndex, total }) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const [activeTouches, setActiveTouches] = useState(0);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const shouldSkipNextClick = useRef(false);
  const lastTouchCountRef = useRef(0);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50;

  // 处理进度条拖动
  const handleProgressMouseDown = (e: React.MouseEvent) => {
    setIsDraggingProgress(true);
    updateProgressFromPosition(e.clientX);
  };

  const handleProgressTouchStart = (e: React.TouchEvent) => {
    setIsDraggingProgress(true);
    if (e.touches.length === 1) {
      updateProgressFromPosition(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgress) {
        updateProgressFromPosition(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingProgress && e.touches.length === 1) {
        updateProgressFromPosition(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      setIsDraggingProgress(false);
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = 'targetTouches' in e ? e.targetTouches[0]?.target : e.target;
      if (menuRef.current && target && !menuRef.current.contains(target as Node)) {
        shouldSkipNextClick.current = true;
        setShowMenu(false);
      }
    };

    if (isDraggingProgress) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside as EventListener);
      document.addEventListener('touchstart', handleClickOutside as EventListener);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousedown', handleClickOutside as EventListener);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isDraggingProgress, showMenu]);

  const updateProgressFromPosition = (clientX: number) => {
    if (progressContainerRef.current) {
      const rect = progressContainerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
      const newIndex = Math.round(percentage * (total - 1));
      onIndexChange(newIndex);
    }
  };

  // 处理鼠标点击
  const handleMouseDown = (e: React.MouseEvent) => {
    if (shouldSkipNextClick.current) {
      shouldSkipNextClick.current = false;
      return;
    }
    if (e.button === 0) { // 左键
      onNext();
    } else if (e.button === 2) { // 右键
      onPrev();
    }
  };

  // 阻止右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // 触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    setActiveTouches(e.touches.length);
    lastTouchCountRef.current = e.touches.length;
    
    if (e.touches.length === 1) {
      setTouchStartTime(now);
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  };

  // 触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    setActiveTouches(e.touches.length);
    
    if (e.touches.length === 1) {
      setTouchEnd({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  };

  // 触摸结束
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (shouldSkipNextClick.current) {
      shouldSkipNextClick.current = false;
      return;
    }
    const now = Date.now();
    const touchDuration = now - touchStartTime;
    
    // 检查是否是双指点击（快速释放）
    if (lastTouchCountRef.current === 2 && e.touches.length === 0) {
      onPrev();
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    
    // 单指点击
    if (touchStart && touchDuration < 300) {
      onNext();
    } else if (touchStart && touchEnd) {
      // 滑动处理
      const distance = touchStart.x - touchEnd.x;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      
      if (isLeftSwipe) {
        onNext();
      } else if (isRightSwipe) {
        onPrev();
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div 
      className="relative min-h-screen min-h-[100dvh] bg-white flex flex-col items-center justify-center px-6 py-8 pt-safe-top pb-safe-bottom cursor-pointer select-none"
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 左上角控制按钮 */}
      {!showMenu && (
        <button
          className="absolute top-4 left-4 z-50 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-all duration-300"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(true);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <Settings className="w-6 h-6 text-slate-600" />
        </button>
      )}

      {/* 菜单卡片 */}
      {showMenu && (
        <div 
          ref={menuRef}
          className="absolute top-4 left-4 z-50 bg-white rounded-2xl shadow-xl p-4 w-72 border border-slate-200"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">设置</h2>
            <button
              className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            <button 
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 rounded-full bg-slate-100">
                <Volume2 className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-xs text-slate-600">音量</span>
            </button>
            
            <button 
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 rounded-full bg-slate-100">
                <Sun className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-xs text-slate-600">亮度</span>
            </button>
            
            <button 
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 rounded-full bg-slate-100">
                <Palette className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-xs text-slate-600">主题</span>
            </button>
            
            <button 
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 rounded-full bg-slate-100">
                <Settings className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-xs text-slate-600">更多</span>
            </button>
          </div>
        </div>
      )}

      <div className="text-center w-full max-w-2xl">
        <p 
          className={`${themeConfig.colors.phonetic} mb-4 font-light`}
          style={{ fontSize: `${themeConfig.phoneticSize}px` }}
        >
          {word.phonetic}
        </p>
        
        <h1 
          className={`font-bold ${themeConfig.colors.word} mb-8 sm:mb-10 tracking-tight leading-tight`}
          style={{ fontSize: `${themeConfig.wordSize}px` }}
        >
          {word.word}
        </h1>
        
        <div className="space-y-3 sm:space-y-4 mb-12 sm:mb-16">
          {word.meaning.map((meaning, idx) => (
            <p 
              key={idx} 
              className={`${themeConfig.colors.meaning} leading-relaxed`}
              style={{ fontSize: `${themeConfig.meaningSize}px` }}
            >
              {meaning}
            </p>
          ))}
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center">
          {total <= 10 ? (
            // 单词数 ≤10 时用圆点
            <div className="flex items-center justify-center space-x-2">
              {Array.from({ length: total }).map((_, idx) => (
                <div
                  key={idx}
                  className={`${themeConfig.dotSize} rounded-full transition-all duration-300 cursor-pointer hover:scale-125 ${
                    idx === currentIndex 
                      ? `${themeConfig.colors.dotActive} scale-150` 
                      : themeConfig.colors.dotInactive
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onIndexChange(idx);
                  }}
                />
              ))}
            </div>
          ) : (
            // 单词数 >10 时用进度条
            <div 
              ref={progressContainerRef}
              className="w-48 h-1.5 bg-slate-200 rounded-full relative cursor-pointer"
              onMouseDown={handleProgressMouseDown}
              onTouchStart={handleProgressTouchStart}
            >
              {/* 增加受击面积的透明容器 */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 cursor-pointer"
                style={{ left: `${(currentIndex / (total - 1)) * 100}%` }}
              >
                {/* 实际显示的黑色竖线 */}
                <div 
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 transition-all duration-300 rounded-full ${
                    isDraggingProgress 
                      ? 'scale-125 h-6 w-1' 
                      : 'w-0.5 h-4 hover:scale-125 hover:h-6 hover:w-1'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordCard;

