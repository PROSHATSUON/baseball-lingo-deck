import { Client } from '@notionhq/client';
import { Play, Search, Video } from 'lucide-react';
import { useState, useMemo } from 'react';

// --- サーバー側でNotionデータを取得 ---
export default async function Home() {
  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const databaseId = process.env.NOTION_DB_ID;

  let results = [];
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: '単語', direction: 'ascending' }],
    });
    
    // データの整形（プロパティ名はあなたのNotionに合わせてください）
    results = response.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        word: p['単語']?.title[0]?.plain_text || 'No Title',
        meaning: p['意味']?.rich_text[0]?.plain_text || '',
        ipa: p['発音記号']?.rich_text[0]?.plain_text || '',
        katakana: p['カタカナ発音']?.rich_text[0]?.plain_text || '',
        genre: p['ジャンル']?.select?.name || 'All',
        memo: p['メモ']?.rich_text[0]?.plain_text || '',
        example: p['例文']?.rich_text[0]?.plain_text || '',
        audioUrl: p['音声']?.url || '',
        videoUrl: p['動画']?.url || '',
      };
    });
  } catch (error) {
    console.error('Notion Error:', error);
  }

  return <ClientComponent words={results} />;
}

// --- クライアント側（ブラウザ）で動く画面 ---
'use client';

function ClientComponent({ words }) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  
  const GENRES = ['All', '基本用語', '打撃/走塁', '投球/守備', '頻出表現'];

  const filteredWords = useMemo(() => {
    return words.filter((item) => {
      const genreMatch = activeTab === 'All' || item.genre === activeTab;
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = 
        item.word.toLowerCase().includes(searchLower) || 
        item.meaning.toLowerCase().includes(searchLower);
      return genreMatch && searchMatch;
    });
  }, [activeTab, searchQuery, words]);

  const playAudio = (e, url) => {
    e.stopPropagation();
    if (url) new Audio(url).play();
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10 font-sans text-gray-800">
      {/* ヘッダー */}
      <div className="bg-blue-900 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold mb-3 text-center">⚾ Baseball Lingo Deck</h1>
        {/* 検索 */}
        <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-800 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        {/* タブ */}
        <div className="flex overflow-x-auto space-x-2 pb-1 no-scrollbar">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveTab(genre)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === genre ? 'bg-yellow-400 text-blue-900' : 'bg-blue-800 text-blue-200'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* リスト */}
      <div className="max-w-md mx-auto p-4 space-y-3">
        {filteredWords.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">No words found.</p>
        ) : (
            filteredWords.map((item) => (
            <div
                key={item.id}
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
            >
                <div className="p-4 flex justify-between items-center">
                    <div className="flex-1">
                        <div className="flex items-baseline space-x-2">
                            <h2 className="text-lg font-bold text-gray-900">{item.word}</h2>
                            <span className="text-xs text-gray-500 font-mono">{item.ipa}</span>
                        </div>
                        <p className="text-gray-700 font-medium mt-1">{item.meaning}</p>
                    </div>
                    {item.audioUrl && (
                        <button onClick={(e) => playAudio(e, item.audioUrl)} className="ml-3 p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                            <Play size={20} fill="currentColor" />
                        </button>
                    )}
                </div>
                {/* 詳細部分 */}
                {expandedId === item.id && (
                    <div className="bg-gray-50 px-4 pb-4 pt-2 border-t border-gray-100 text-sm">
                        <div className="mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Kana</span>
                            <p>{item.katakana}</p>
                        </div>
                        {item.memo && (
                            <div className="mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase">Memo</span>
                                <p className="bg-yellow-50 p-2 rounded border border-yellow-100">{item.memo}</p>
                            </div>
                        )}
                        {item.example && (
                            <div className="mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase">Example</span>
                                <p className="italic border-l-2 border-blue-300 pl-2 text-gray-600">"{item.example}"</p>
                            </div>
                        )}
                        {item.videoUrl && (
                             <a href={item.videoUrl} target="_blank" className="flex items-center justify-center space-x-2 w-full py-2 bg-red-50 text-red-600 rounded-lg mt-2 hover:bg-red-100">
                                <Video size={16} /><span>動画を見る</span>
                             </a>
                        )}
                    </div>
                )}
            </div>
            ))
        )}
      </div>
    </div>
  );
}