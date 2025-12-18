// app/lib/vapiClient.ts
import Vapi from "@vapi-ai/web";

if (!process.env.NEXT_PUBLIC_VAPI_API_KEY) {
  console.error("❌ Missing: NEXT_PUBLIC_VAPI_API_KEY");
}

export const vapiClient = new Vapi(
  process.env.NEXT_PUBLIC_VAPI_API_KEY!
);

// Debug listeners (optional)
const eventHandler = (event: string, data: any) => {
  console.log(`⚡ VAPI EVENT: ${event}`, data);
};

vapiClient.on("call-start", () => eventHandler("call-start", undefined));
vapiClient.on("call-end", () => eventHandler("call-end", undefined));
vapiClient.on("message", (m) => eventHandler("message", m));
vapiClient.on("error", (e) => eventHandler("error", e));
vapiClient.on("speech-start", () => eventHandler("speech-start", undefined));
vapiClient.on("speech-end", () => eventHandler("speech-end", undefined));
vapiClient.on("volume-level", (v) => eventHandler("volume-level", v));
