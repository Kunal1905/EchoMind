import { AuthenticateWithRedirectCallback, SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import AuthLayout, { clerkAppearance } from "@/app/components/AuthLayout";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create an EchoMind account and start a private voice reflection.",
  alternates: {
    canonical: "/sign-up",
  },
};

type SignUpPageProps = {
  params?: Promise<{
    "sign-up"?: string[];
  }>;
};

export default async function SignUpPage({ params }: SignUpPageProps) {
  const segments = (await params)?.["sign-up"] ?? [];
  const isSsoCallback = segments[0] === "sso-callback";

  return (
    <AuthLayout mode="sign-up">
      {isSsoCallback ? (
        <AuthenticateWithRedirectCallback
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
        />
      ) : (
        <SignUp
          path="/sign-up"
          appearance={clerkAppearance}
        />
      )}
    </AuthLayout>
  );
}
