export function SectionCard({ eyebrow, title, description, children, className = '' }) {
  return (
    <section className={`glass-panel rounded-[30px] border border-white/85 bg-white/72 p-6 shadow-panel ${className}`}>
      {(eyebrow || title || description) && (
        <header className="mb-6">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clay">{eyebrow}</p> : null}
          {title ? <h2 className="mt-2 font-display text-3xl text-slate">{title}</h2> : null}
          {description ? <p className="mt-2 max-w-2xl text-sm text-slate/70">{description}</p> : null}
        </header>
      )}
      {children}
    </section>
  );
}