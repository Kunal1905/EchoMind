"use client";

export default function SentryExamplePage() {
  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white">
      <div className="mx-auto max-w-xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-violet-300">
          Sentry test
        </p>
        <h1 className="mb-4 text-4xl font-semibold">Send a test error</h1>
        <p className="mb-8 text-zinc-300">
          Click the button below to send a sample client-side error to Sentry.
          Use this only while verifying the SDK setup.
        </p>
        <button
          type="button"
          onClick={() => {
            throw new Error("Sentry example client error");
          }}
          className="rounded-full bg-violet-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-violet-400"
        >
          Throw test error
        </button>
      </div>
    </main>
  );
}
