import Link from "next/link";
import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="authPage">
      <section className="authPanel">
        <Link href="/" className="brand authBrand">
          CraftID
        </Link>
        <div className="eyebrow">Secure access</div>
        <h1>Sign in to CraftID</h1>
        <p className="authIntro">
          Access your professional record, evidence and profile settings.
        </p>

        {params.error ? <p className="formMessage error">{params.error}</p> : null}
        {params.message ? (
          <p className="formMessage">{params.message}</p>
        ) : null}

        <form className="authForm" action={login}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
            />
          </label>
          <button className="button buttonPrimary" type="submit">
            Sign in
          </button>
        </form>

        <p className="authFoot">
          New to CraftID? <Link href="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
