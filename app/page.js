import ClientPage from './ClientPage';

export default async function Home() {
  // 環境変数のチェック
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DB_ID) {
    return <div className="p-10 text-red-600">環境変数が設定されていません</div>;
  }

  const databaseId = process.env.NOTION_DB_ID;
  const apiKey = process.env.NOTION_API_KEY;

  try {
    // ★ここがポイント：ライブラリを使わず、直接URLを叩く！
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [{ property: '単語', direction: 'ascending' }],
      }),
      // キャッシュを無効化して常に最新を取る
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      throw new Error(`Notion API Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // データの整形
    const results = data.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        word: p['単語']?.title?.[0]?.plain_text || 'No Title',
        meaning: p['意味']?.rich_text?.[0]?.plain_text || '',
        ipa: p['発音記号']?.rich_text?.[0]?.plain_text || '',
        katakana: p['カタカナ発音']?.rich_text?.[0]?.plain_text || '',
        genre: p['ジャンル']?.select?.name || 'All',
        memo: p['メモ']?.rich_text?.[0]?.plain_text || '',
        example: p['例文']?.rich_text?.[0]?.plain_text || '',
        audioUrl: p['音声']?.url || '',
        videoUrl: p['動画']?.url || '',
      };
    });

    return <ClientPage words={results} />;

  } catch (error) {
    return (
      <div className="p-10 text-red-600">
        <h2 className="font-bold text-xl">通信エラー</h2>
        <p>{error.message}</p>
        <p className="text-sm mt-2 text-gray-500">※データベースIDやAPIキーを確認してください</p>
      </div>
    );
  }
}