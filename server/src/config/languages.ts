export const SUPPORTED_LANGUAGES = {
  en: { label: "English",        transcriberLang: "en", transcriberModel: "nova-2" },
  hi: { label: "हिंदी (Hindi)",   transcriberLang: "hi", transcriberModel: "nova-2" },
  mr: { label: "मराठी (Marathi)", transcriberLang: "mr", transcriberModel: "nova-3" }, // Marathi STT only exists on nova-3
  ta: { label: "தமிழ் (Tamil)",  transcriberLang: "ta", transcriberModel: "nova-3" }, // Tamil STT only exists on nova-3
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;
