export const SUPPORTED_LANGUAGES = {
  en: { label: "English",   transcriberLang: "en",    voiceId: "aura-asteria-en" },
  hi: { label: "हिंदी (Hindi)", transcriberLang: "hi", voiceId: "aura-2-hindi" }, // check current Deepgram Aura Hindi voice ID in your Vapi dashboard
  mr: { label: "मराठी (Marathi)", transcriberLang: "mr", voiceId: "aura-2-hindi" }, // Marathi often falls back to Hindi-family voice
  ta: { label: "தமிழ் (Tamil)",  transcriberLang: "ta", voiceId: "aura-2-hindi" },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;