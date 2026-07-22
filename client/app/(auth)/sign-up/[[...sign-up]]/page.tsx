import { SignUp } from "@clerk/nextjs";
import AuthLayout, { clerkAppearance } from "@/app/components/AuthLayout";

export default function SignUpPage() {
  return (
    <AuthLayout mode="sign-up">
      <SignUp
        path="/sign-up"
        appearance={clerkAppearance}
      />
    </AuthLayout>
  );
}