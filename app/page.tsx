import Link from "next/link";
import { SITE } from "@/lib/site";
import { visibleApps, CATEGORY_LABELS, CATEGORY_ORDER, type AppManifest } from "@/lib/registry";
import { ThemePicker } from "@/components/ThemePicker";
import { currentUserId } from "@/lib/session";
import { touchUser } from "@/lib/store";

/**
 * The hub. Everything shown here is driven by the registry, so a new app
 * appears the moment it is registered.
 */
export default async function HubPage() {
  const userId = await currentUserId();

  // First visit to the hub is where a user row gets created. It's best-effort:
  // the database being unavailable should never block the page from rendering.
  if (userId) {
    try {
      await touchUser(userId);
    } catch (error) {
      console.error("[hub] could not record visit:", error);
    }
  }

  const apps = visibleApps();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:pt-14">
      <header className="mb-10 text-center">
        <div className="text-3xl tracking-[0.4em] text-accent" aria-hidden="true">
          ♠♥♦♣
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-[0.15em] sm:text-4xl">
          {SITE.name}
        </h1>
        <p className="mt-2 text-muted">{SITE.tagline}</p>
        <div className="mt-5 flex justify-center">
          <ThemePicker />
        </div>
      </header>

      {CATEGORY_ORDER.map((category) => {
        const inCategory = apps.filter((app) => app.category === category);
        if (inCategory.length === 0) return null;

        return (
          <section key={category} className="mb-9">
            <h2 className="label-caps mb-3">{CATEGORY_LABELS[category]}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {inCategory.map((app) => (
                <AppCard key={app.slug} app={app} />
              ))}
            </div>
          </section>
        );
      })}

      <p className="mt-12 text-center text-sm text-muted/70">
        Your games are saved to this browser automatically. No account needed.
      </p>
    </main>
  );
}

function AppCard({ app }: { app: AppManifest }) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="panel group flex items-start gap-3 p-4 transition hover:border-accent/70 hover:bg-ink/10"
    >
      <span className={`text-3xl leading-none ${app.accent}`} aria-hidden="true">
        {app.icon}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-lg font-bold tracking-wide">{app.title}</span>
        <span className="mt-0.5 block text-sm text-muted">{app.blurb}</span>
      </span>
    </Link>
  );
}
