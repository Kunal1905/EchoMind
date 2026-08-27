"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  CalendarClock,
  CreditCard,
  Download,
  LoaderCircle,
  Mail,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import api from "../lib/api";

type BillingPayment = {
  paymentId: string;
  planName: string;
  amount: number | null;
  currency: string;
  paymentMethod: string | null;
  cardLast4: string | null;
  createdAt: string | null;
  receiptAvailable: boolean;
};

type BillingData = {
  billingEmail: string;
  paymentMethodOnFile: null;
  nextBilling: null;
  taxStatus: "not_separately_itemised";
  payments: BillingPayment[];
};

function formatAmount(amount: number | null, currency: string) {
  if (amount === null) return "Amount unavailable";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

function formatMethod(payment: BillingPayment) {
  if (!payment.paymentMethod) return "Razorpay";
  const method = payment.paymentMethod.replace(/_/g, " ");
  return payment.cardLast4 ? `${method} ending in ${payment.cardLast4}` : method;
}

async function tokenWithTimeout(getToken: () => Promise<string | null>) {
  return Promise.race([
    getToken(),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("Authentication timed out")), 8000);
    }),
  ]);
}

export function BillingOverview() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const getTokenRef = useRef(getToken);
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const loadBilling = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    setError(null);
    try {
      const token = await tokenWithTimeout(getTokenRef.current);
      const response = await api.get("/subscription/billing", token ? {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      } : { timeout: 15000 });
      setData(response.data);
    } catch {
      setError("Billing details could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setData(null);
      return;
    }
    void loadBilling();
  }, [isLoaded, isSignedIn, loadBilling]);

  const downloadReceipt = async (payment: BillingPayment) => {
    if (downloadingId) return;
    setDownloadingId(payment.paymentId);
    try {
      const token = await tokenWithTimeout(getTokenRef.current);
      const response = await api.get(
        `/subscription/receipts/${encodeURIComponent(payment.paymentId)}`,
        {
          responseType: "blob",
          ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        }
      );
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `echomind-receipt-${payment.paymentId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("That receipt could not be downloaded. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const billingEmail = data?.billingEmail || user?.primaryEmailAddress?.emailAddress || "Account email unavailable";

  if (!isLoaded || !isSignedIn) return null;

  const scrollToPlans = () => {
    document.getElementById("pricing-plans")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="mt-20 border-y border-white/10 py-12" aria-labelledby="billing-title">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="void-kicker mb-3">Billing</p>
          <h2 id="billing-title" className="text-3xl font-semibold text-white">
            Payments and receipts
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-white/55">
          EchoMind uses one-time minute-pack payments. It does not store a reusable card or schedule automatic charges.
        </p>
      </div>

      <dl className="grid border-t border-white/10 sm:grid-cols-3">
        <div className="border-b border-white/10 py-6 sm:pr-6 sm:border-r">
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-white/45">
            <CreditCard size={15} /> Payment method
          </dt>
          <dd className="mt-3 font-semibold text-white">Not stored</dd>
          <dd className="mt-1 text-sm leading-5 text-white/50">Choose a payment method securely in Razorpay each time.</dd>
          <dd className="mt-4">
            <button
              type="button"
              onClick={scrollToPlans}
              className="text-sm font-semibold text-teal-300 transition hover:text-teal-200"
            >
              Choose at checkout
            </button>
          </dd>
        </div>
        <div className="border-b border-white/10 py-6 sm:px-6 sm:border-r">
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-white/45">
            <CalendarClock size={15} /> Next billing
          </dt>
          <dd className="mt-3 font-semibold text-white">No scheduled charge</dd>
          <dd className="mt-1 text-sm leading-5 text-white/50">Minute packs do not renew automatically.</dd>
        </div>
        <div className="border-b border-white/10 py-6 sm:pl-6">
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-white/45">
            <Mail size={15} /> Billing email
          </dt>
          <dd className="mt-3 break-all font-semibold text-white">{billingEmail}</dd>
          <dd className="mt-1 text-sm leading-5 text-white/50">Managed through your EchoMind account.</dd>
        </div>
      </dl>

      {loading ? (
        <div className="flex min-h-32 items-center justify-center border-t border-white/10 text-sm text-white/55">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading billing details...
        </div>
      ) : error && !data ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-3 border-t border-red-400/25 text-sm text-red-200">
          <p>{error}</p>
          <button type="button" onClick={() => void loadBilling()} className="void-ghost inline-flex items-center gap-2">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : data ? (
        <>
          {error && (
            <p className="mb-5 border-y border-red-400/25 py-3 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}

          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2">
              <ReceiptText size={18} className="text-teal-300" />
              <h3 className="text-lg font-semibold text-white">Payment history</h3>
            </div>

            {data.payments.length === 0 ? (
              <p className="border-y border-white/10 py-7 text-sm text-white/50">No minute-pack purchases yet.</p>
            ) : (
              <div className="overflow-x-auto border-t border-white/10">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase text-white/40">
                    <tr>
                      <th className="py-4 pr-4 font-semibold">Date</th>
                      <th className="px-4 py-4 font-semibold">Plan</th>
                      <th className="px-4 py-4 font-semibold">Method</th>
                      <th className="px-4 py-4 font-semibold">Amount</th>
                      <th className="py-4 pl-4 text-right font-semibold">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {data.payments.map((payment) => (
                      <tr key={payment.paymentId}>
                        <td className="py-4 pr-4 text-white/65">
                          {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString("en-IN") : "Unavailable"}
                        </td>
                        <td className="px-4 py-4 font-semibold text-white">{payment.planName}</td>
                        <td className="px-4 py-4 capitalize text-white/65">{formatMethod(payment)}</td>
                        <td className="px-4 py-4 text-white">{formatAmount(payment.amount, payment.currency)}</td>
                        <td className="py-4 pl-4 text-right">
                          <button
                            type="button"
                            onClick={() => void downloadReceipt(payment)}
                            disabled={downloadingId !== null}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 transition hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {downloadingId === payment.paymentId ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download size={15} />
                            )}
                            PDF receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="mt-5 text-xs leading-5 text-white/40">
            Tax is not separately itemised. Downloads are payment receipts, not GST or VAT tax invoices. A legal tax invoice requires configured business identity, address, and tax-registration details.
          </p>
        </>
      ) : null}
    </section>
  );
}
