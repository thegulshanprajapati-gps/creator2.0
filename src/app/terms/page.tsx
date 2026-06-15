import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service • XmartyCreator',
  description: 'Terms of Service for XmartyCreator.',
};

export default function TermsPage() {
  return (
    <div className="w-full">
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <header className="space-y-4">
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground max-w-2xl">
            By using XmartyCreator, you agree to these terms. Please read them carefully.
          </p>
        </header>

        <div className="mt-10 space-y-8">
          <section className="rounded-3xl border bg-card/60 backdrop-blur-sm p-6 md:p-8">
            <h2 className="font-headline text-xl font-semibold">Acceptable use</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Do not misuse the service, attempt unauthorized access, or interfere with normal operation.
            </p>
          </section>

          <section className="rounded-3xl border bg-card/60 backdrop-blur-sm p-6 md:p-8">
            <h2 className="font-headline text-xl font-semibold">Accounts</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              You are responsible for safeguarding your credentials and for activity on your account.
            </p>
          </section>

          <section className="rounded-3xl border bg-card/60 backdrop-blur-sm p-6 md:p-8">
            <h2 className="font-headline text-xl font-semibold">Content</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              You retain ownership of your content. You grant us permission to host and display it solely to provide the
              service.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}

