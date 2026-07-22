import { SignIn } from "@clerk/nextjs";
import AuthLayout, { clerkAppearance } from "@/app/components/AuthLayout";

export default function SignInPage() {
  return (
    <AuthLayout mode="sign-in">
      <SignIn
        path="/sign-in"
        appearance={clerkAppearance}
      />
    </AuthLayout>
  );
}