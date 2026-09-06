// Locale registry. `uiComplete` marks locales whose interface chrome is fully
// translated (and, for en/hi, human-written). Others are offered as ASSISTANT
// languages: the Groq chatbot and voice respond in them, while UI chrome falls back
// to English — this is labelled honestly in the selector. Machine/unreviewed
// translations are never presented as reviewed legal terminology.
export interface LocaleInfo {
  code: string;
  native: string; // language name in its own script
  english: string; // English name
  dir: "ltr" | "rtl";
  /** BCP-47 tag used for browser speech recognition / synthesis. */
  speechTag: string;
  /** UI chrome fully translated (vs. assistant-only). */
  uiComplete: boolean;
}

export const LOCALES: LocaleInfo[] = [
  { code: "en", native: "English", english: "English", dir: "ltr", speechTag: "en-IN", uiComplete: true },
  { code: "hi", native: "हिन्दी", english: "Hindi", dir: "ltr", speechTag: "hi-IN", uiComplete: true },
  { code: "bn", native: "বাংলা", english: "Bengali", dir: "ltr", speechTag: "bn-IN", uiComplete: false },
  { code: "ta", native: "தமிழ்", english: "Tamil", dir: "ltr", speechTag: "ta-IN", uiComplete: true },
  { code: "te", native: "తెలుగు", english: "Telugu", dir: "ltr", speechTag: "te-IN", uiComplete: false },
  { code: "mr", native: "मराठी", english: "Marathi", dir: "ltr", speechTag: "mr-IN", uiComplete: false },
  { code: "kn", native: "ಕನ್ನಡ", english: "Kannada", dir: "ltr", speechTag: "kn-IN", uiComplete: false },
  { code: "gu", native: "ગુજરાતી", english: "Gujarati", dir: "ltr", speechTag: "gu-IN", uiComplete: false },
  { code: "pa", native: "ਪੰਜਾਬੀ", english: "Punjabi", dir: "ltr", speechTag: "pa-IN", uiComplete: false },
  { code: "ml", native: "മലയാളം", english: "Malayalam", dir: "ltr", speechTag: "ml-IN", uiComplete: false },
  { code: "or", native: "ଓଡ଼ିଆ", english: "Odia", dir: "ltr", speechTag: "or-IN", uiComplete: false },
  { code: "ur", native: "اردو", english: "Urdu", dir: "rtl", speechTag: "ur-IN", uiComplete: false },
];

export const DEFAULT_LOCALE = "en";

export function getLocale(code: string | null | undefined): LocaleInfo {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

// State/UT code -> suggested language codes (does not restrict choice).
export const STATE_LANGUAGE_SUGGESTIONS: Record<string, string[]> = {
  TN: ["ta"],
  KA: ["kn"],
  MH: ["mr"],
  KL: ["ml"],
  AP: ["te"],
  TS: ["te"],
  WB: ["bn"],
  GJ: ["gu"],
  PB: ["pa"],
  OD: ["or"],
  BR: ["hi"],
  UP: ["hi"],
  MP: ["hi"],
  RJ: ["hi"],
  HR: ["hi"],
  DL: ["hi"],
  JH: ["hi"],
  CG: ["hi"],
  UK: ["hi"],
  HP: ["hi"],
  JK: ["ur"],
  AS: ["bn"],
};

export function suggestedLanguages(stateCode?: string | null): string[] {
  const base = ["en", "hi"];
  const extra = stateCode ? (STATE_LANGUAGE_SUGGESTIONS[stateCode] ?? []) : [];
  return Array.from(new Set([...extra, ...base]));
}
