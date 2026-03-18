export function FormField({ label, hint, children }) {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate">{label}</span>
        {hint ? <span className="text-xs uppercase tracking-[0.16em] text-slate/45">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}