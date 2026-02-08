import LoginCard from "@/app/[locale]/(auth)/login/components/login-card";
import LoginForm from "@/app/[locale]/(auth)/login/components/login-form";
import { PageShell } from "@/components/layout/page-shell";

export default function LoginPage() {
  return (
    <PageShell className="flex items-center justify-center px-4">
      <LoginCard>
        <LoginForm />
      </LoginCard>
    </PageShell>
  );
}
