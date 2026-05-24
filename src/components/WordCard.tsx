
import React, { useState, useRef, useEffect } from "react";
import { Word } from "@/types/word";
import { themeConfig } from "@/config/theme";

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
  const lastTouchCountRef = useRef(0);
  const progressContainerRef = useRef<HTMLDivElement>(null);
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

    if (isDraggingProgress) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingProgress]);

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
                  className={`${themeConfig.dotSize} rounded-full transition-all duration-300 cursor-pointer hover:scale-150 ${
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
                      ? 'h-5 w-0.75' 
                      : 'w-0.5 h-4 hover:h-5 hover:w-0.75'
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

