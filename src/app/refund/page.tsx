import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy • XmartyCreator',
  description: 'Refund Policy for XmartyCreator.',
};

export default function RefundPage() {
  return (
    <div className="w-full">
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <header className="space-y-4">
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Refund Policy</h1>
          <p className="text-muted-foreground max-w-2xl">
            We aim to be fair and transparent. Refund eligibility can vary by product and purchase type.
          </p>
        </header>

        <div className="mt-10 space-y-8">
          <section className="rounded-3xl border bg-card/60 backdrop-blur-sm p-6 md:p-8">
            <h2 className="font-headline text-xl font-semibold">Eligibility</h2>
            <ul className="mt-3 list-disc pl-5 text-muted-foreground space-y-2">
              <li>Request within a reasonable timeframe from purchase.</li>
              <li>Provide order details and the reason for the request.</li>
              <li>Some digital goods may be ineligible once substantially consumed.</li>
            </ul>
          </section>

          <section className="rounded-3xl border bg-card/60 backdrop-blur-sm p-6 md:p-8">
            <h2 className="font-headline text-xl font-semibold">How to request</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Contact support through the Contact page with your order ID and email used for purchase. We’ll confirm the
              outcome by email.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}

