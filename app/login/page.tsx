import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const sesion = await getSesion();
  if (sesion) redirect(searchParams.redirect ?? "/leads");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-eva">Siempre Eva</h1>
          <p className="text-sm text-neutral-600">Acceso al panel de leads</p>
        </div>
        <LoginForm redirectTo={searchParams.redirect ?? "/leads"} />
      </div>
    </main>
  );
}
