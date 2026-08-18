import { parseZLibraryHtml } from "../utils/zlibrary";

export default defineEventHandler(async (e) => {
  const query = await getQuery(e);

  const title = query?.title?.toString().trim() ?? "";

  try {
    const data = await $fetch(`https://z-lib.gl/s/${encodeURIComponent(title)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    return parseZLibraryHtml(data as string);
  } catch (error) {
    console.error(error);
    return [];
  }
})