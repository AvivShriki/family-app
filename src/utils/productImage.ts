// Product images for shopping items: try Open Food Facts, fall back to a category emoji.

// Ordered list — first match wins, so specific terms (תפוח אדמה) come before general ones (תפוח).
const CATEGORY_EMOJI: [string, string][] = [
  ['תפוח אדמה', '🥔'], ['תפוחי אדמה', '🥔'],
  ['חלב', '🥛'], ['לחם', '🍞'], ['ביצים', '🥚'], ['ביצה', '🥚'],
  ['גבינה', '🧀'], ['קוטג', '🧀'], ['יוגורט', '🥛'], ['חמאה', '🧈'],
  ['עגבני', '🍅'], ['מלפפון', '🥒'], ['בצל', '🧅'], ['שום', '🧄'],
  ['גזר', '🥕'], ['פלפל', '🫑'], ['חסה', '🥬'], ['אבוקדו', '🥑'],
  ['בננ', '🍌'], ['תפוז', '🍊'], ['לימון', '🍋'], ['תפוח', '🍎'],
  ['ענבים', '🍇'], ['אבטיח', '🍉'], ['מלון', '🍈'], ['תות', '🍓'], ['אפרסק', '🍑'],
  ['עוף', '🍗'], ['בשר', '🥩'], ['דג', '🐟'], ['סלמון', '🐟'], ['טונה', '🥫'],
  ['אורז', '🍚'], ['פסטה', '🍝'], ['ספגטי', '🍝'], ['פתיתים', '🍚'], ['קמח', '🌾'],
  ['שמן', '🫒'], ['זית', '🫒'], ['סוכר', '🍬'], ['מלח', '🧂'], ['דבש', '🍯'],
  ['קפה', '☕'], ['תה', '🍵'], ['מיץ', '🧃'], ['מים', '💧'], ['סודה', '🥤'], ['קולה', '🥤'],
  ['בירה', '🍺'], ['יין', '🍷'],
  ['שוקולד', '🍫'], ['עוגיות', '🍪'], ['עוגה', '🍰'], ['גלידה', '🍦'],
  ['חטיף', '🍿'], ['במבה', '🥜'], ['ביסלי', '🍿'], ['דגני בוקר', '🥣'],
  ['חיתולים', '👶'], ['מגבונים', '👶'], ['מטרנה', '🍼'], ['בקבוק', '🍼'],
  ['נייר טואלט', '🧻'], ['מגבות נייר', '🧻'], ['סבון', '🧼'], ['שמפו', '🧴'],
  ['אקונומיקה', '🧽'], ['ניקוי', '🧽'], ['אבקת כביסה', '🧺'], ['מרכך', '🧺'],
];

export function categoryEmoji(name: string): string {
  const lower = name.trim();
  for (const [keyword, emoji] of CATEGORY_EMOJI) {
    if (lower.includes(keyword)) return emoji;
  }
  return '🛒';
}

// Search Open Food Facts for a small product photo. Returns null on any failure —
// the endpoint is slow at times and rate-limited (~10 searches/min), so failures
// are expected and the category emoji covers them.
// (The newer search.openfoodfacts.org endpoint is faster but sends no CORS
// headers, so browsers block it — don't switch to it.)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchProductImage(name: string): Promise<string | null> {
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=5' +
    '&fields=product_name,image_front_small_url,image_small_url' +
    `&search_terms=${encodeURIComponent(name.trim())}`;

  // The endpoint intermittently rejects requests (rate limiter answers without
  // CORS headers, which surfaces as a fetch failure) — a couple of retries
  // makes it reliable in practice. Total worst case ~13s, all in background.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await sleep(1500 * attempt);
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000));
      const res = await Promise.race([fetch(url), timeout]);
      if (!res) return null; // timed out — server is slow, don't hammer it
      if (!res.ok) continue;
      const data = await res.json();
      const products: any[] = data?.products ?? [];
      const withImage = products.find((p) => p.image_front_small_url || p.image_small_url);
      return withImage?.image_front_small_url ?? withImage?.image_small_url ?? null;
    } catch {
      // fall through to retry
    }
  }
  return null;
}
