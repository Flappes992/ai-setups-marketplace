import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Gemeinsamer Rahmen für alle Rechtstexte (Impressum / Datenschutz / AGB).
 * Underscore-Ordner `_legal` ist in Next.js App Router privat → wird nicht geroutet.
 */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0F1115] text-gray-200">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            set<span className="text-[#2DD4BF]">iq</span>
          </Link>
          <nav className="flex gap-5 text-sm text-gray-400">
            <Link href="/agb" className="hover:text-white">AGB</Link>
            <Link href="/datenschutz" className="hover:text-white">Datenschutz</Link>
            <Link href="/impressum" className="hover:text-white">Impressum</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">Stand: {updated}</p>
        <div className="legal-body mt-10 space-y-6 text-[15px] leading-relaxed text-gray-300">
          {children}
        </div>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-3xl px-6 py-8 text-xs text-gray-500">
          © 2026 Setiq · <Link href="/impressum" className="hover:text-white">Impressum</Link> ·{' '}
          <Link href="/datenschutz" className="hover:text-white">Datenschutz</Link> ·{' '}
          <Link href="/agb" className="hover:text-white">AGB</Link>
        </div>
      </footer>
    </div>
  );
}

/** Abschnitts-Überschrift im Rechtstext. */
export function LegalH2({ children }: { children: ReactNode }) {
  return <h2 className="pt-4 text-xl font-semibold text-white">{children}</h2>;
}

/** Klar markierter Platzhalter, den Sicci vor dem Live-Gang ausfüllen muss. */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded bg-[#2DD4BF]/15 px-1.5 py-0.5 font-medium text-[#5EEAD4]">
      [{children}]
    </mark>
  );
}
