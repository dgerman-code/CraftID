import Link from "next/link";
import { signup } from "./actions";

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <main className="authPage">
      <section className="authPanel">
        <Link href="/" className="brand authBrand">
          CraftID
        </Link>
        <div className="eyebrow">Create a professional identity</div>
        <h1>Create your account</h1>
        <p className="authIntro">
          Your account is the secure owner of your future CraftID professional
          or workshop record.
        </p>

        {params.error ? <p className="formMessage error">{params.error}</p> : null}

        <form className="authForm" action={signup}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
          <label>
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
          <button className="button buttonPrimary" type="submit">
            Create account
          </button>
        </form>

        <p className="authFoot">
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
