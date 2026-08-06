import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getApp, APPS, APP_COMPONENTS } from "@/lib/registry";

/**
 * One route hosts every app. It resolves the slug against the registry and
 * lazily loads that app's component, so adding an app never means adding a
 * route.
 */

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return APPS.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const app = getApp(slug);
  if (!app) return {};
  return { title: app.title, description: app.blurb };
}

export default async function AppPage({ params }: Props) {
  const { slug } = await params;
  const app = getApp(slug);
  const load = APP_COMPONENTS[slug];
  if (!app || !load) notFound();

  const { default: AppComponent } = await load();

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-6">
      <nav className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-lilac transition hover:text-gold"
        >
          <span aria-hidden="true">←</span> All apps
        </Link>
      </nav>
      <AppComponent />
    </main>
  );
}
