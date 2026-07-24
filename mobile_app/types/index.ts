/** A book/text entry in the library */
export interface Book {
  id: number;
  title: string;
  author: string;
  cover: string | null;
  progress: number;
  wordIndex: number;
}

/** A chapter of a book stored in SQLite */
export interface BookChapter {
  id: number;
  bookId: number;
  playOrder: number;
  label: string;
  href: string | null;
  content: string;
}

/** ORP-split word for RSVP display */
export interface FormattedWord {
  part1: string;
  focus: string;
  part2: string;
  isIntro: boolean;
}

/** Navigation tab definition */
export interface NavTab {
  value: string;
  label: string;
  icon: string;
  route: string;
}

/** User settings stored locally */
export interface UserSettings {
  id: number;
  currentBookId: number | null;
  showFixation: boolean;
  readingSpeed: number;
  theme: 'dark' | 'light';
}

/** A reading session record */
export interface ReadingSession {
  id: number;
  bookId: number;
  durationSeconds: number;
  wpm: number;
  wordsRead: number;
  createdAt: number;
}

/** Search result from online book search */
export interface SearchResult {
  id: string;
  title: string;
  author: string;
  cover: string | null;
  details: string | null;
}

/** Stats summary */
export interface Stats {
  totalMinutes: number;
  maxWpm: number;
  booksCount: number;
  streak: number;
  totalWordsRead: number;
}
