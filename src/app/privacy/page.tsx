import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy • XmartyCreator',
  description: 'Privacy Policy for XmartyCreator.',
};

export default function PrivacyPage() {
  return (
    <div className="w-full">
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <header className="space-y-4">
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground max-w-2xl">
            This policy explains what we collect, why we collect it, and how you control your data.
          </p>
        </header>

        <div className="mt-10 space-y-8">
          <section className="rounded-3xl border bg-card/60 backdrop-blur-sm p-6 md:p-8">
            <h2 className="font-headline text-xl font-semibold">Data we collect</h2>
            <ul className="mt-3 list-disc pl-5 text-muted-foreground space-y-2">
              <li>Account details you provide (name, email).</li>
              <li>Usage signals (pages visited, feature interactions) to improve the product.</li>
              <li>Technical data (device, browser) for security and performance.</li>
            </ul>
          </section>

          <section className="rounded-3xl border bg-card/60 backdrop-blur-sm p-6 md:p-8">
            <h2 className="font-headline text-xl font-semibold">How we use data</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We use data to provide the service, secure accounts, improve UX, and communicate product updates.
            </p>
          </section>

          <section className="rounded-3xl border bg-card/60 backdrop-blur-sm p-6 md:p-8">
            <h2 className="font-headline text-xl font-semibold">Your choices</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              You can request data export or deletion by contacting support. Where applicable, you may opt out of certain
              analytics in your browser settings.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}

