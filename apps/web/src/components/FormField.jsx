export function FormField({ label, hint, error, children }) {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate">{label}</span>
        {hint ? <span className="text-xs uppercase tracking-[0.16em] text-slate/45">{hint}</span> : null}
      </div>
      {children}
      {error ? <span className="text-sm font-medium text-[#c24d2c]">{error}</span> : null}
    </label>
  );
}