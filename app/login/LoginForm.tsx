"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInAction, type LoginState } from "./actions";
import PasswordInput from "@/components/PasswordInput";

const initialState: LoginState = { error: null };

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction] = useFormState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500">
          Email
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded border border-neutral-300 px-3 py-2 text-sm focus:border-eva focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500">
          Contraseña
        </span>
        <PasswordInput
          name="password"
          autoComplete="current-password"
          required
          className="rounded border border-neutral-300 px-3 py-2 text-sm focus:border-eva focus:outline-none"
        />
      </label>

      {state.error && (
        <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-eva px-4 py-2 text-sm font-semibold text-white hover:bg-eva-dark disabled:opacity-60"
    >
      {pending ? "Ingresando…" : "Ingresar"}
    </button>
  );
}
