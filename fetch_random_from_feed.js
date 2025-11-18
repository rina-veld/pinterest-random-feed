const fs = require("fs");

const FEED_URL = "https://iudjzw-en.myshopify.com/a/feed/superfeed.xml";

async function main() {
  console.log("Fetching feed:", FEED_URL);

  const response = await fetch(FEED_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();

  const items = [];
  const itemRegex = /<item\b[^>]*>[\s\S]*?<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    items.push(match[0]);
  }

  if (items.length === 0) {
    throw new Error("Не нашла ни одного <item> в фиде");
  }

  function extractTag(item, tag) {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    const m = item.match(re);
    if (!m) return null;

    // убираем <![CDATA[...]]>
    return m[1]
      .trim()
      .replace(/^<!\[CDATA\[/, "")
      .replace(/\]\]>$/, "")
      .trim();
  }

  let randomItem = null;
  let link = null;
  let image = null;
  let title = null;
  let description
