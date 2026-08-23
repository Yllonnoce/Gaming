import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getApp, APPS, APP_COMPONENTS } from "@/lib/registry";
import { ThemePicker } from "@/components/ThemePicker";
import { FontSizePicker } from "@/components/FontSizePicker";
import { RulesPanel } from "@/components/RulesPanel";
import { getRules } from "@/lib/rules";

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
  const rules = getRules(slug);

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-6">
      <nav className="mb-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-accent"
        >
          <span aria-hidden="true">←</span> All apps
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          {rules && (
            <a
              href="#rules"
              className="text-sm text-muted underline underline-offset-2 transition hover:text-accent"
            >
              {rules.heading ? "How it works" : "How to play"}
            </a>
          )}
          <ThemePicker />
          <FontSizePicker />
        </div>
      </nav>
      <AppComponent />
      {rules && <RulesPanel rules={rules} title={app.title} />}
    </main>
  );
}
