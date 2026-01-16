'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export default function ClientPage({ words }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // フィルタリング処理
  const filteredWords = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return words.filter((item) => {
      // 検索ワードがない場合は全表示（あるいは件数を絞ることも可）
      if (!query) return true;
      return (
        item.word.toLowerCase().includes(query) || 
        item.meaning.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, words]);

  // ★頂いたコードの再生ロジックを移植（Safari対応）
  const playAudio = (e, rawUrl) => {
    e.stopPropagation(); // カードが開くのを防ぐ
    if (!rawUrl) return;

    // 既存のプレイヤーがあれば削除
    const oldAudio = document.getElementById('audio-player');
    if (oldAudio) oldAudio.remove();

    // URL変換ロジック
    let fileId = "";
    const match1 = rawUrl.match(/id=([a-zA-Z0-9_-]{25,})/);
    const match2 = rawUrl.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
    if (match1) fileId = match1[1];
    else if (match2) fileId = match2[1];

    const playUrl = fileId 
      ? `https://docs.google.com/uc?export=download&confirm=no_antivirus&id=${fileId}` 
      : rawUrl;

    // Audio要素生成と再生
    const audio = document.createElement('audio');
    audio.id = 'audio-player';
    audio.src = playUrl;
    audio.referrerPolicy = "no-referrer"; 
    audio.crossOrigin = "anonymous";
    audio.autoplay = true;
    audio.style.display = 'none';
    
    audio.onerror = function() { 
        alert("音声が再生できませんでした。\n(アクセス権限またはファイルを確認してください)"); 
    };
    document.body.appendChild(audio);
  };

  return (
    // 全体の背景色
    <div className="min-h-screen pb-20 font-sans text-[#333]" style={{ backgroundColor: '#f8f9fa' }}>
      
      {/* --- ヘッダー（すりガラス風） --- */}
      <div className="sticky top-0 z-50 border-b border-[#ddd] px-4 py-3 shadow-sm"
           style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
        
        {/* 検索ボックス */}
        <div className="flex gap-2 mb-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="検索"
              className="w-full rounded-lg border border-[#ddd] bg-[#f0f2f5] py-2.5 pl-3 pr-3 text-sm outline-none transition-colors focus:border-[#e67e22] focus:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className="rounded-lg px-4 py-2 text-sm font-bold text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: '#e67e22' }}
          >
            検索
          </button>
        </div>

        {/* ステータスバー */}
        <div className="text-right text-xs text-[#aaa] h-4">
            {filteredWords.length}件 表示中
        </div>
      </div>

      {/* --- リスト表示エリア --- */}
      <div className="p-3 min-h-[200px]">
        {filteredWords.length === 0 ? (
          <div className="text-center text-[#ccc] py-10 text-sm">見つかりませんでした</div>
        ) : (
          filteredWords.map((item) => (
            <div
              key={item.id}
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="mb-3 overflow-hidden rounded-xl border border-[#ececec] bg-white shadow-sm transition-transform active:scale-[0.98]"
            >
              {/* カード表面 */}
              <div className="flex items-center justify-between p-4 cursor-pointer">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {/* 単語 */}
                    <span className="text-lg font-extrabold text-[#2c3e50]">{item.word}</span>
                    {/* 再生ボタン */}
                    {item.audioUrl && (
                      <button
                        onClick={(e) => playAudio(e, item.audioUrl)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#ddd] bg-[#f0f0f0] text-xs text-[#2c3e50] active:bg-[#ccc]"
                      >
                        ▶
                      </button>
                    )}
                  </div>
                  {/* 発音記号 */}
                  <span className="text-xs text-[#999] font-mono">{item.ipa}</span>
                </div>
                {/* 意味（右側） */}
                <div className="max-w-[45%] overflow-hidden text-ellipsis whitespace-nowrap text-right text-sm text-[#666]">
                  {item.meaning}
                </div>
              </div>

              {/* 詳細（展開時のみ表示） */}
              {expandedId === item.id && (
                <div className="bg-[#fafafa] border-t border-[#f0f0f0] px-4 pb-4 pt-0">
                  
                  {/* 詳細行: 意味 */}
                  <div className="mt-2">
                    <div className="text-[0.7rem] font-bold text-[#e67e22] mb-0.5">意味</div>
                    <div className="text-sm font-bold whitespace-pre-wrap">{item.meaning}</div>
                  </div>

                  {/* 詳細行: カタカナ */}
                  <div className="mt-2">
                    <div className="text-[0.7rem] font-bold text-[#e67e22] mb-0.5">カタカナ</div>
                    <div className="text-sm text-[#333]">{item.katakana}</div>
                  </div>

                  {/* 詳細行: メモ */}
                  <div className="mt-2">
                    <div className="text-[0.7rem] font-bold text-[#e67e22] mb-0.5">メモ</div>
                    <div className="text-sm whitespace-pre-wrap">{item.memo || "-"}</div>
                  </div>

                  {/* 詳細行: 例文 */}
                  <div className="mt-2">
                    <div className="text-[0.7rem] font-bold text-[#e67e22] mb-0.5">例文</div>
                    <div className="text-sm italic text-[#333]">"{item.example || "-"}"</div>
                  </div>
                  
                   {/* 詳細行: ジャンル */}
                   <div className="mt-2">
                    <div className="text-[0.7rem] font-bold text-[#e67e22] mb-0.5">ジャンル</div>
                    <div className="text-sm text-[#333]">{item.genre}</div>
                  </div>

                  {/* 動画リンク */}
                  {item.videoUrl && (
                    <div className="mt-3 text-center">
                        <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-block w-full py-2 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100">
                           YouTubeで確認する
                        </a>
                    </div>
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