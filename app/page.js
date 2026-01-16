import { Client } from '@notionhq/client';
import ClientPage from './ClientPage'; // さっき作ったファイルを読み込む

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
    
    // データの整形
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

  // クライアントコンポーネントを表示してデータを渡す
  return <ClientPage words={results} />;
}