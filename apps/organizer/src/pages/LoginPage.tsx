import { useState, type FormEvent } from "react";
import { Button, Card, Field, Status } from "@multitrack/ui";
import { login, toErrorMessage } from "../services/authService";

export function LoginPage({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await login(String(body.email), String(body.password));
      onAuthenticated();
    } catch (reason) {
      setError(toErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mt-shell mt-main">
      <Card>
        <h1>Espace organisateur</h1>
        <form className="mt-form" onSubmit={submit}>
          <Field label="Adresse e-mail"><input name="email" type="email" required /></Field>
          <Field label="Mot de passe"><input name="password" type="password" required /></Field>
          <Status loading={loading} error={error} />
          <Button disabled={loading}>Se connecter</Button>
        </form>
      </Card>
    </main>
  );
}
