import AppShell from "./AppShell";

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "EchoMind",
  url: "https://www.echomind.co.in/",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description:
    "A voice-first AI companion for private emotional reflection, mood check-ins, and session summaries.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    description: "Ten free voice conversation minutes each month.",
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <AppShell />
    </>
  );
}
