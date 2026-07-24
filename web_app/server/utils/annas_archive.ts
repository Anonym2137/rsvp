import { DOMParser, HTMLAnchorElement } from "linkedom";
import { SearchResult } from "../types";

/**
 * Parse raw HTML response from Anna's Archive search page
 * and extract search results.
 */
export function parseAnnasArchiveHtml(html: string): SearchResult[] {
   const parser = new DOMParser;
   const document = parser.parseFromString(html, "text/html");

   const parentElements: HTMLAnchorElement[] = document.querySelectorAll(
      ".custom-a.block.mr-2.sm\\:mr-4.hover\\:opacity-80"
   );

   const results: SearchResult[] = Array.from(parentElements).map((item) => {
      const href = item?.getAttribute("href") || "";
      const id = href.replace("/md5/", "");
      const title = item.querySelector(".text-violet-900")?.getAttribute("data-content") || "Bez tytułu";
      const author = item.querySelector(".text-amber-900")?.getAttribute("data-content") || "Nieznany";
      const cover = item.querySelector("img")?.getAttribute("src") || null;
      
      const details = item.parentElement?.querySelector(".text-gray-800")?.textContent?.trim() || null;         
      
      return {
         id,
         title,
         author,
         cover,
         details,
      };
   });

   return results;
}
