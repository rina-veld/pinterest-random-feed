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

  // Вытаскиваем текст внутри тега
  function extractTag(item, tag) {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    const m = item.match(re);
    return m ? m[1].trim() : null;
  }

  // Чистим CDATA: <![CDATA[ ... ]]>
  function cleanValue(value) {
    if (!value) return null;
    return value
      .replace(/^<!\[CDATA\[/, "")
      .replace(/\]\]>$/, "")
      .trim();
  }

  let randomItem = null;
  let link = null;
  let image = null;
  let title = null;
  let description = null;

  // Несколько попыток найти товар с нормальной ссылкой
  for (let attempt = 0; attempt < 20; attempt++) {
    const randomIndex = Math.floor(Math.random() * items.length);
    randomItem = items[randomIndex];

    // URL товара
    link =
      extractTag(randomItem, "g:link") ||
      extractTag(randomItem, "link");

    // Картинка товара
    image =
      extractTag(randomItem, "g:image_link") ||
      extractTag(randomItem, "image_link");

    // Заголовок
    title =
      extractTag(randomItem, "title") ||
      extractTag(randomItem, "g:title");

    // Описание
    description =
      extractTag(randomItem, "description") ||
      extractTag(randomItem, "g:description");

    if (link) break;
  }

  if (!link) {
    throw new Error("Не удалось найти ни одного item с тегом <g:link> или <link>");
  }

  const payload = {
    generated_at: new Date().toISOString(),
    link: cleanValue(link),
    image: cleanValue(image),
    title: cleanValue(title),
    description: cleanValue(description),
  };

  fs.writeFileSync("random_item.json", JSON.stringify(payload, null, 2), "utf-8");
  console.log("Saved random_item.json:", payload);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
