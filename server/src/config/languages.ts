export const SUPPORTED_LANGUAGES = {
  en: {
    label: "English",
    transcriberLang: "en",
    transcriberModel: "nova-2",
    firstMessage: "Hey! How are you feeling today?",
    responseInstruction: "Speak in natural conversational English unless the user explicitly asks to switch languages.",
  },
  hi: {
    label: "हिंदी (Hindi)",
    transcriberLang: "hi",
    transcriberModel: "nova-2",
    firstMessage: "नमस्ते! आज आप कैसा महसूस कर रहे हैं?",
    responseInstruction: "Speak in natural conversational Hindi unless the user explicitly asks to switch languages.",
  },
  mr: {
    label: "मराठी (Marathi)",
    transcriberLang: "mr",
    transcriberModel: "nova-3",
    firstMessage: "नमस्कार! आज तुम्हाला कसं वाटत आहे?",
    responseInstruction: "Speak in natural conversational Marathi unless the user explicitly asks to switch languages.",
  },
  ta: {
    label: "தமிழ் (Tamil)",
    transcriberLang: "ta",
    transcriberModel: "nova-3",
    firstMessage: "வணக்கம்! இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?",
    responseInstruction: "Speak in natural conversational Tamil unless the user explicitly asks to switch languages.",
  },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;
