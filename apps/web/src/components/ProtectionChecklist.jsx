export function ProtectionChecklist({ checklist }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-slate/15 bg-white/82">
      <table className="min-w-full border-collapse text-sm text-slate">
        <thead className="bg-[#111111] text-white">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Etapas</th>
            <th className="px-4 py-3 text-center font-semibold">Necessidade</th>
            <th className="px-4 py-3 text-center font-semibold">Coberto</th>
            <th className="px-4 py-3 text-center font-semibold">Nec</th>
            <th className="px-4 py-3 text-center font-semibold">Cob</th>
          </tr>
        </thead>
        <tbody>
          {(checklist ?? []).map((item) => {
            const needed = Boolean(item.needed);
            const covered = Boolean(item.covered);

            return (
              <tr key={item.key} className="border-t border-slate/10">
                <td className="px-4 py-3 font-semibold">{item.label}</td>
                <td className={`px-4 py-3 text-center font-semibold ${needed ? 'bg-[#96d04a] text-[#10220d]' : 'bg-[#f52323] text-white'}`}>
                  {needed ? 'Sim' : 'Nao'}
                </td>
                <td className={`px-4 py-3 text-center font-semibold ${covered ? 'bg-[#96d04a] text-[#10220d]' : 'bg-[#f52323] text-white'}`}>
                  {covered ? 'Sim' : 'Nao'}
                </td>
                <td className="px-4 py-3 text-center">{needed ? 1 : 0}</td>
                <td className="px-4 py-3 text-center">{covered ? 1 : 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}