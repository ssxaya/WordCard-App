import React, { useState, useEffect } from "react";
import WordCard from "@/components/WordCard";
import { loadWordsFromTXT } from "@/utils/wordLoader";
import { Word } from "@/types/word";

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载单词
    loadWordsFromTXT().then(loadedWords => {
      setWords(loadedWords);
      setLoading(false);
    });
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-400">未找到单词</div>
      </div>
    );
  }

  return (
    <WordCard
      word={words[currentIndex]}
      onNext={handleNext}
      onPrev={handlePrev}
      onIndexChange={handleIndexChange}
      currentIndex={currentIndex}
      total={words.length}
    />
  );
}