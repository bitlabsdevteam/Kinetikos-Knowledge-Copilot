import type { ChatHistoryEntry, ChatResponse, Citation } from '@/lib/contracts';

type KnowledgeDoc = {
  id: string;
  title: string;
  sourceType: Citation['sourceType'];
  href: string;
  excerpt: string;
  keywords: string[];
  answer: string;
};

type KnowledgeLookupInput = {
  message: string;
  history?: ChatHistoryEntry[];
};

const knowledgeBase: KnowledgeDoc[] = [
  {
    id: 'manual-breathing-basics',
    title: '呼吸の基本ガイド',
    sourceType: 'manual',
    href: 'https://example.com/kinetikos/manuals/breathing-basics',
    excerpt:
      'まず呼吸を整え、無理な可動域拡大よりも胸郭と骨盤の協調を回復させることが優先される。',
    keywords: ['呼吸', '胸郭', '骨盤', '姿勢', '可動域'],
    answer:
      'Kinetikosの基本方針では、姿勢や可動域の改善を急ぐ前に、呼吸の安定と胸郭・骨盤の協調を整えることが重要です。土台が崩れたまま局所だけを動かすと、再現性の低い変化になりやすいためです。',
  },
  {
    id: 'article-pain-reframing',
    title: '痛みの見方を再構成する',
    sourceType: 'article',
    href: 'https://example.com/kinetikos/articles/pain-reframing',
    excerpt:
      '痛みは単純な損傷シグナルではなく、文脈・予測・防御反応が重なった出力として理解する。',
    keywords: ['痛み', '疼痛', '防御', '予測', '文脈'],
    answer:
      'Kinetikosの知識ベースでは、痛みは単純な損傷の量ではなく、防御反応や予測も含む出力として扱われます。そのため、評価では局所だけでなく呼吸、負荷履歴、安心感、動作文脈まで含めて見直すことが推奨されます。',
  },
  {
    id: 'video-foot-pressure',
    title: '足圧と立位バランスの実践',
    sourceType: 'video',
    href: 'https://example.com/kinetikos/videos/foot-pressure',
    excerpt:
      '足部接地は母趾球だけに偏らず、踵・小趾球を含む支持の広がりを確保する。',
    keywords: ['足圧', '立位', 'バランス', '足部', '接地'],
    answer:
      '立位バランスの調整では、母趾球だけに体重を集めるのではなく、踵と小趾球も含めて支持面を広く使うことが基本です。Kinetikosでは、接地の偏りを整えることで上位の代償を減らす考え方が示されています。',
  },
];

const refusal: ChatResponse = {
  grounded: false,
  answer:
    '現時点の知識ベース候補だけでは、その質問に十分根拠を持って回答できません。関連するKinetikos資料が取得できたら、その範囲で改めて整理します。',
  citations: [],
};

function collectQueryContext(message: string, history: ChatHistoryEntry[] = []) {
  const recentUserTurns = history
    .filter((entry) => entry.role === 'user')
    .slice(-3)
    .map((entry) => entry.text.trim())
    .filter(Boolean);

  return [message.trim(), ...recentUserTurns].join('\n');
}

function scoreDocument(doc: KnowledgeDoc, queryContext: string) {
  return doc.keywords.reduce((score, keyword) => {
    return queryContext.includes(keyword.toLowerCase()) ? score + 1 : score;
  }, 0);
}

export function answerFromKnowledgeBase({ message, history = [] }: KnowledgeLookupInput): ChatResponse {
  const queryContext = collectQueryContext(message, history).toLowerCase();

  const rankedMatches = knowledgeBase
    .map((doc) => ({
      doc,
      score: scoreDocument(doc, queryContext),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  if (rankedMatches.length === 0) {
    return refusal;
  }

  const selected = rankedMatches.slice(0, 2).map((entry) => entry.doc);

  const citations: Citation[] = selected.map((doc) => ({
    id: doc.id,
    title: doc.title,
    sourceType: doc.sourceType,
    href: doc.href,
    excerpt: doc.excerpt,
  }));

  const answer = selected.map((doc) => doc.answer).join('\n\n');

  return {
    grounded: true,
    answer,
    citations,
  };
}
