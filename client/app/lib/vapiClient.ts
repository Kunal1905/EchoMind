import Vapi from "@vapi-ai/web";

const isDevelopment = process.env.NODE_ENV !== "production";

if (isDevelopment && !process.env.NEXT_PUBLIC_VAPI_API_KEY) {
  console.error("Missing NEXT_PUBLIC_VAPI_API_KEY");
}

export const vapiClient = new Vapi(
  process.env.NEXT_PUBLIC_VAPI_API_KEY!
);

// Keep lifecycle diagnostics useful in development without logging transcripts,
// assistant payloads, or high-frequency volume data.
if (isDevelopment) {
  vapiClient.on("call-start", () => console.debug("[vapi] call-start"));
  vapiClient.on("call-end", () => console.debug("[vapi] call-end"));
  vapiClient.on("speech-start", () => console.debug("[vapi] speech-start"));
  vapiClient.on("speech-end", () => console.debug("[vapi] speech-end"));
  vapiClient.on("error", (error: { message?: unknown; status?: unknown; type?: unknown }) => {
    console.error("[vapi] error", {
      message: error?.message,
      status: error?.status,
      type: error?.type,
    });
  });
}

export const isVapiClientReady = () => {
  return !!process.env.NEXT_PUBLIC_VAPI_API_KEY;
};
