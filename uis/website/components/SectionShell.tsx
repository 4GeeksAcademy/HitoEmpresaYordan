import type { ReactNode } from "react";

export type SectionShellProps = {
  id?: string;
  title?: string;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
};

export function SectionShell({
  id,
  title,
  eyebrow,
  className,
  children,
}: SectionShellProps) {
  return (
    <section id={id} className={`mx-auto w-full max-w-7xl px-4 py-14 sm:px-8 sm:py-20 ${className ?? ""}`}>
      {(eyebrow || title) && (
        <header className="mb-8">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">{eyebrow}</p>
          ) : null}
          {title ? (
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h2>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
}
