import { formatTableNumber } from '../lib/formatters.js';

export function ProtectionChecklist({ checklist }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#173d5d]/10 bg-white shadow-[0_18px_34px_rgba(23,61,93,0.08)]">
      <table className="min-w-full border-collapse text-xs text-slate md:text-sm">
        <thead className="bg-[linear-gradient(135deg,#173d5d_0%,#355f9b_100%)] text-white">
          <tr>
            <th className="px-3 py-2.5 text-left font-semibold">Etapas</th>
            <th className="px-3 py-2.5 text-center font-semibold">Necessidade</th>
            <th className="px-3 py-2.5 text-center font-semibold">Coberto</th>
            <th className="px-3 py-2.5 text-center font-semibold">Nec</th>
            <th className="px-3 py-2.5 text-center font-semibold">Cob</th>
          </tr>
        </thead>
        <tbody>
          {(checklist ?? []).map((item) => {
            const needed = Boolean(item.needed);
            const covered = Boolean(item.covered);

            return (
              <tr key={item.key} className="border-t border-slate/10 odd:bg-slate/0 even:bg-slate/5">
                <td className="px-3 py-2.5 font-semibold leading-snug text-slate">{item.label}</td>
                <td className={`px-3 py-2.5 text-center font-semibold ${needed ? 'bg-[#dff1c9] text-[#1f4a13]' : 'bg-[#fbe0e0] text-[#8b1f1f]'}`}>
                  {needed ? 'Sim' : 'Nao'}
                </td>
                <td className={`px-3 py-2.5 text-center font-semibold ${covered ? 'bg-[#dff1c9] text-[#1f4a13]' : 'bg-[#fbe0e0] text-[#8b1f1f]'}`}>
                  {covered ? 'Sim' : 'Nao'}
                </td>
                <td className="px-3 py-2.5 text-center">{formatTableNumber(needed ? 1 : 0)}</td>
                <td className="px-3 py-2.5 text-center">{formatTableNumber(covered ? 1 : 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}