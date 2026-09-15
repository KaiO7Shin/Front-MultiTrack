import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return <button className={`mt-button ${className}`} {...rest} />;
}

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <section className={`mt-card ${className}`} {...props} />;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mt-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Status({
  loading,
  error,
}: {
  loading?: boolean;
  error?: string | null;
}) {
  if (loading) return <p className="mt-status">Chargement…</p>;
  if (error) return <p className="mt-error" role="alert">{error}</p>;
  return null;
}
