type HowItWorksStepProps = {
  step: string;
  description: string;
  number: number;
};

export function HowItWorksStep({ step, description, number }: HowItWorksStepProps) {
  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className="font-semibold text-sm">{step}</h4>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
