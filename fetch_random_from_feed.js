const fs = require("fs");

const FEED_URL = "https://iudjzw-en.myshopify.com/a/feed/superfeed.xml";

async function main() {
  console.log("Fetching feed:", FEED_URL);

  const response = await fetch(FEED_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();

  // Ищем все <item>...</item>
  const items = [];
  const itemRegex = /<item\b[^>]*>[\s\S]*?<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    items.push(match[0]);
  }

  if (items.length === 0) {
    throw new Error("Не нашла ни одного <item> в фиде");
  }

  // Выбираем случайный item
  const randomIndex = Math.floor(Math.random() * items.length);
  const randomItem = items[randomIndex];

  // Функция для вытаскивания значений из тегов
  function extractTag(tag) {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    const m = randomItem.match(re);
    return m ? m[1].trim() : null;
  }

  // Shopify Superfeed использует <product_url> вместо <link>
  const link = extractTag("product_url");
  const title = extractTag("title");
  const description = extractTag("description");

  if (!link) {
    throw new Error("У случайного item нет <product_url>");
  }

  const payload = {
    generated_at: new Date().toISOString(),
    link,
    title,
    description,
  };

  fs.writeFileSync("random_item.json", JSON.stringify(payload, null, 2), "utf-8");

  console.log("Saved random_item.json:", payload);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
