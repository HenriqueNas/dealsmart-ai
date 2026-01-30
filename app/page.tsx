export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            DealSmart AI
          </h1>
          <p className="text-lg text-(--accent)">Communications Hub</p>
        </div>

        <p className="max-w-lg text-lg leading-relaxed text-foreground/70">
          AI-powered customer communications platform for dealerships. Manage
          conversations, collaborate with AI on responses, and sync activity
          with HubSpot CRM.
        </p>

        <div className="mt-4 flex flex-col gap-3 text-sm text-foreground/50">
          <p>View and manage customer conversations</p>
          <p>Get AI-assisted response suggestions</p>
          <p>Sync seamlessly with HubSpot CRM</p>
        </div>

        <div className="mt-8 rounded-lg border border-foreground/10 px-6 py-3">
          <p className="text-sm text-foreground/40">
            Under Development &mdash; API-First Architecture
          </p>
        </div>
      </main>
    </div>
  );
}
