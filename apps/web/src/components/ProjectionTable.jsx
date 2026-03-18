import { formatCurrency } from '../lib/formatters.js';

export function ProjectionTable({ rows }) {
  if (!rows?.length) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white/72">
      <div className="max-h-[420px] overflow-auto">
        <table className="min-w-full border-collapse text-left text-sm text-slate">
          <thead className="sticky top-0 bg-[#f4eee4] text-xs uppercase tracking-[0.18em] text-slate/60">
            <tr>
              <th className="px-4 py-3">Idade</th>
              <th className="px-4 py-3">PL inicial</th>
              <th className="px-4 py-3">Renda do ano</th>
              <th className="px-4 py-3">Gasto do ano</th>
              <th className="px-4 py-3">PL final</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.age} className="border-t border-slate/8">
                <td className="px-4 py-3 font-semibold">{row.age}</td>
                <td className="px-4 py-3">{formatCurrency(row.openingBalance)}</td>
                <td className="px-4 py-3">{formatCurrency(row.yearlyIncome)}</td>
                <td className="px-4 py-3">{formatCurrency(row.yearlySpend)}</td>
                <td className={`px-4 py-3 font-semibold ${row.endingBalance < 0 ? 'text-clay' : 'text-deep'}`}>
                  {formatCurrency(row.endingBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}