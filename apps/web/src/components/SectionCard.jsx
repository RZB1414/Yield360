export function SectionCard({ eyebrow, title, description, children, className = '' }) {
  return (
    <section
      className={`glass-panel rounded-[28px] border border-white/70 bg-white/62 p-5 shadow-[0_18px_36px_rgba(23,61,93,0.07)] sm:p-6 ${className}`}
    >
      {(eyebrow || title || description) && (
        <header className="mb-5 border-b border-[#173d5d]/8 pb-4">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clay">{eyebrow}</p> : null}
          {title ? <h2 className="mt-2 font-display text-[1.9rem] leading-tight text-slate sm:text-3xl">{title}</h2> : null}
          {description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate/68">{description}</p> : null}
        </header>
      )}
      {children}
    </section>
  );
}