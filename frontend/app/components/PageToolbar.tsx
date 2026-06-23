import type { ReactNode } from 'react';

interface PageToolbarProps {
  title: string;
  description?: string;
  meta?: ReactNode;
}

export default function PageToolbar({ title, description, meta }: PageToolbarProps) {
  return (
    <header className="border-b border-divider bg-canvas py-8 lg:py-10">
      <div className="mx-auto flex max-w-6xl min-w-0 flex-col gap-4 px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div className="min-w-0">
          <h1
            className="font-display text-3xl font-semibold tracking-tight text-ink lg:text-4xl"
            style={{ overflowWrap: 'anywhere' }}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">{description}</p>
          ) : null}
        </div>
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </div>
    </header>
  );
}
