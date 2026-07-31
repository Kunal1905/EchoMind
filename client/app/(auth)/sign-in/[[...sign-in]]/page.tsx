import { AuthenticateWithRedirectCallback, SignIn } from "@clerk/nextjs";
import AuthLayout, { clerkAppearance } from "@/app/components/AuthLayout";

type SignInPageProps = {
  params?: Promise<{
    "sign-in"?: string[];
  }>;
};

export default async function SignInPage({ params }: SignInPageProps) {
  const segments = (await params)?.["sign-in"] ?? [];
  const isSsoCallback = segments[0] === "sso-callback";

  return (
    <AuthLayout mode="sign-in">
      {isSsoCallback ? (
        <AuthenticateWithRedirectCallback
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
        />
      ) : (
        <SignIn
          path="/sign-in"
          appearance={clerkAppearance}
        />
      )}
    </AuthLayout>
  );
}
