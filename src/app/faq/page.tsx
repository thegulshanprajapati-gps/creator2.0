import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ • XmartyCreator',
  description: 'Frequently asked questions about XmartyCreator.',
};

const faqs = [
  {
    q: 'What is XmartyCreator?',
    a: 'XmartyCreator is an enterprise EdTech orchestration platform that helps you ship courses, communities, and learning experiences with premium UI and modern workflows.',
  },
  {
    q: 'Do I need an account to browse?',
    a: 'No. You can browse public pages like Courses, Blog, and Updates without signing in. Accounts are required for personalized features.',
  },
  {
    q: 'How do I contact support?',
    a: 'Use the Contact page or the Support Portal link in the footer. We typically respond within 24–48 hours on business days.',
  },
  {
    q: 'Can I request a refund?',
    a: 'Yes—please review the Refund Policy and reach out with your order details. We handle requests case-by-case depending on the product.',
  },
];

export default function FAQPage() {
  return (
    <div className="w-full">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="space-y-4">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
              Quick answers to the most common questions. If you need help, use the Contact page.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="rounded-3xl border bg-card/60 backdrop-blur-sm p-6 md:p-8 shadow-sm"
              >
                <h2 className="font-headline text-lg md:text-xl font-semibold">{item.q}</h2>
                <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

