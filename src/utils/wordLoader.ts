import { Word } from '@/types/word';

// 加载txt文件中的单词列表
export async function loadWordsFromTXT(): Promise<Word[]> {
  try {
    const response = await fetch('/words.txt');
    const text = await response.text();
    
    // 解析文本：每行一个单词，过滤空行
    const words = text.split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);
    
    // 转换为Word格式（暂时用占位符，等待API）
    return words.map(word => ({
      word: word,
      phonetic: `/${word}/`, // 临时占位
      meaning: [`单词：${word}`], // 临时占位
    }));
  } catch (error) {
    console.error('加载单词失败:', error);
    return [];
  }
}
