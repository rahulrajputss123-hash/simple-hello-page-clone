type FeatureCardProps = {
  title: string;
  description: string;
};

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
