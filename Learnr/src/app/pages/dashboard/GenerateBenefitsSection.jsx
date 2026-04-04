import { Activity, ShieldCheck, Sparkles } from 'lucide-react';

const BENEFITS = [
  {
    title: 'Neural Processing',
    description: 'Our AI analyzes structural logic to identify core concepts and remove filler content.',
    Icon: Sparkles,
  },
  {
    title: 'Academic Validation',
    description: 'Content is cross-referenced with academic datasets for better answer reliability.',
    Icon: ShieldCheck,
  },
  {
    title: 'Retention-First Design',
    description: 'Generated cards are optimized for spaced repetition and active recall workflows.',
    Icon: Activity,
  },
];

export default function GenerateBenefitsSection() {
  return (
    <section className="gen-benefits" aria-label="Generation quality benefits">
      {BENEFITS.map(({ title, description, Icon }) => (
        <article key={title}>
          <Icon size={16} />
          <h4>{title}</h4>
          <p>{description}</p>
        </article>
      ))}
    </section>
  );
}
