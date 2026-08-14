"use client";

import { Phone, ShieldAlert, X } from "lucide-react";

type CrisisSupportDialogProps = {
  isOpen: boolean;
  onDismiss: () => void;
};

const supportLines = [
  {
    name: "KIRAN Mental Health Helpline",
    numbers: [{ label: "1800-599-0019", href: "tel:18005990019" }],
  },
  {
    name: "Tele MANAS",
    numbers: [
      { label: "14416", href: "tel:14416" },
      { label: "1800-891-4416", href: "tel:18008914416" },
    ],
  },
];

export function CrisisSupportDialog({ isOpen, onDismiss }: CrisisSupportDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-support-title"
      aria-describedby="crisis-support-description"
    >
      <div className="relative w-full max-w-lg overflow-y-auto rounded-lg border border-red-300/35 bg-[#0b0b0d] p-5 shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white"
          aria-label="Dismiss crisis support"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <ShieldAlert className="mb-4 text-red-300" size={30} aria-hidden="true" />
        <h2 id="crisis-support-title" className="max-w-sm text-2xl font-semibold text-white">
          You don&apos;t have to handle this alone
        </h2>
        <p id="crisis-support-description" className="mt-2 pr-4 text-sm leading-6 text-white/70">
          Connect with a trained mental health professional now. Tap a number to call.
        </p>

        <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {supportLines.map((line) => (
            <section key={line.name} className="py-5">
              <h3 className="text-sm font-semibold text-white">{line.name}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {line.numbers.map((number) => (
                  <a
                    key={number.href}
                    href={number.href}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    <Phone size={17} aria-hidden="true" />
                    {number.label}
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-5 text-sm leading-6 text-red-100/80">
          If you may act on these thoughts now, call local emergency services or go to the nearest emergency department.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-5 w-full border-t border-white/15 pt-4 text-sm font-semibold text-white/70 transition-colors hover:text-white"
        >
          Stay in the conversation
        </button>
      </div>
    </div>
  );
}
