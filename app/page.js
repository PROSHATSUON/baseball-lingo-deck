import { Client } from '@notionhq/client';
import ClientPage from './ClientPage';

export default async function Home() {
  // 環境変数のチェック（これが空なら設定ミス）
  if (!process.env.NOTION_API_KEY) {
    return <ErrorScreen msg="NOTION_API_KEY が設定されていません" />;
  }
  if (!process.env.NOTION_DB_ID) {
    return <ErrorScreen msg="NOTION_DB_ID が設定されていません" />;
  }

  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const databaseId = process.env.NOTION_DB_ID;

  let results = [];
  
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    
    // データ取得成功！整形処理
    results = response.results.map((page) => {
      const p = page.properties;
      
      // プロパティが存在するかチェック
      if (!p['単語']) {
         throw new Error("Notionに「単語」という列が見つかりません。「名前」や「Name」になっていませんか？");
      }

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
    // エラー内容を画面に出す
    return <ErrorScreen msg={error.message} detail={JSON.stringify(error, null, 2)} />;
  }

  return <ClientPage words={results} />;
}

// エラー表示用の簡易コンポーネント
function ErrorScreen({ msg, detail }) {
  return (
    <div className="p-10 bg-red-50 text-red-900 min-h-screen font-mono">
      <h1 className="text-2xl font-bold mb-4">⚠️ エラーが発生しました</h1>
      <p className="text-lg font-bold mb-4">{msg}</p>
      {detail && (
        <pre className="bg-white p-4 rounded border border-red-200 overflow-auto text-sm">
          {detail}
        </pre>
      )}
      <div className="mt-8 text-sm text-gray-600">
        <p>確認ポイント:</p>
        <ul className="list-disc ml-5">
          <li>Notionデータベースの右上の「...」→「接続先」にインテグレーションを追加しましたか？</li>
          <li>Notionの列の名前は「単語」になっていますか？（「名前」ではダメです）</li>
        </ul>
      </div>
    </div>
  );
}