import { NewBook, NewBookContent } from "~~/shared/types"


export type EpubBook = {
   metaData: NewBook;
   chapters: Omit<NewBookContent, "bookId">[];
}

export type SearchResult = {
   id: string;
   title: string;
   author: string;
   cover: string | null;
   details: string | null;
}