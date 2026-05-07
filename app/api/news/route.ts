import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const runtime = "nodejs";
export const revalidate = 300;

type NewsItem = {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  thumbnail: string | null;
};

type RssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  content?: string;
  "content:encoded"?: string;
  media?: { $?: { url?: string } };
  mediaThumbnail?: { $?: { url?: string } };
  enclosure?: { url?: string; type?: string };
};

const parser = new Parser<object, RssItem>({
  customFields: {
    item: [
      ["media:content", "media", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["enclosure", "enclosure"],
      ["content:encoded", "content:encoded"],
    ],
  },
});

const RSS_SOURCES = [
  {
    name: "한국경제 증권",
    url: "https://www.hankyung.com/feed/finance",
  },
  {
    name: "한국경제 경제",
    url: "https://www.hankyung.com/feed/economy",
  },
  {
    name: "Investing.com",
    url: "https://kr.investing.com/rss/news_14.rss",
  },
  {
    name: "CNBC Markets",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664",
  },
] as const;

function extractFirstImage(html?: string): string | null {
  if (!html) return null;

  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function extractThumbnail(item: RssItem): string | null {
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.media?.$?.url) return item.media.$.url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image")) {
    return item.enclosure.url;
  }

  return extractFirstImage(item["content:encoded"]) ?? extractFirstImage(item.content);
}

async function fetchFeed(source: (typeof RSS_SOURCES)[number]): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(source.url);

    return (feed.items ?? []).slice(0, 5).map((item) => ({
      title: item.title?.trim() ?? "",
      link: item.link ?? "",
      source: source.name,
      pubDate: item.pubDate ?? item.isoDate ?? "",
      thumbnail: extractThumbnail(item),
    }));
  } catch (error) {
    console.error(`[news] RSS fetch failed for ${source.name}`, error);
    return [];
  }
}

export async function GET() {
  const results = await Promise.allSettled(RSS_SOURCES.map((source) => fetchFeed(source)));
  const news = results
    .filter((result): result is PromiseFulfilledResult<NewsItem[]> => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .filter((item) => item.title && item.link)
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 8);

  return NextResponse.json(
    {
      news,
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
