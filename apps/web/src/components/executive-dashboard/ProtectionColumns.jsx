function StatusBadge({ label, active }) {
  const iconClass = active
    ? 'bg-[#39b54a] text-white shadow-[0_12px_22px_rgba(57,181,74,0.24)]'
    : 'bg-[#eef3f9] text-[#c4cfdb]';

  return (
    <div aria-label={`${label}: ${active ? 'Marcado' : 'Nao marcado'}`} className="flex items-center justify-center">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${iconClass}`}>
        {active ? 'OK' : 'X'}
      </span>
    </div>
  );
}

function ToggleButton({ label, active, fieldPath, onFieldChange }) {
  const iconClass = active
    ? 'bg-[#39b54a] text-white shadow-[0_12px_22px_rgba(57,181,74,0.24)] hover:bg-[#2faa41]'
    : 'bg-[#eef3f9] text-[#c4cfdb] hover:bg-[#e5edf6]';

  return (
    <button
      type="button"
      onClick={() => onFieldChange?.(fieldPath, !active)}
      aria-pressed={active}
      aria-label={`${label}: ${active ? 'Marcado' : 'Nao marcado'}`}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold transition duration-150 focus:outline-none focus:ring-4 focus:ring-[#355f9b]/12 ${iconClass}`}
    >
      {active ? 'OK' : 'X'}
    </button>
  );
}

export function ProtectionColumns({ protectionLayers = [], needCount, coveredCount, readOnly = true, onFieldChange }) {
  const totalProtectionLayers = protectionLayers.length;
  const statusPathMap = {
    needed: 'control.protectionNeeds',
    covered: 'control.protectionCoverage'
  };

  return (
    <div className="flex flex-col rounded-[30px] border border-white/90 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-4 shadow-[0_22px_44px_rgba(23,61,93,0.08)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#3e4f6c]">Niveis de protecao</p>
          <p className="mt-1 text-[11px] leading-5 text-[#a4b3c8]">
            {readOnly ? 'Checklist unificado das camadas prioritarias.' : 'Marque rapidamente o que e necessario e o que ja esta coberto.'}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[240px]">
          <div className="rounded-[22px] border border-[#dcf2df] bg-[linear-gradient(180deg,#ffffff_0%,#f8fef9_100%)] px-4 py-3 shadow-[0_10px_20px_rgba(82,168,104,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6a7f98]">Necessario</p>
            <p className="mt-2 text-[2rem] font-semibold leading-none text-[#3fb04f]">
              {needCount}<span className="ml-1 text-xl text-[#9db6a5]">/ {totalProtectionLayers}</span>
            </p>
          </div>
          <div className="rounded-[22px] border border-[#dbe5ff] bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)] px-4 py-3 shadow-[0_10px_20px_rgba(70,112,216,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6a7f98]">Coberto</p>
            <p className="mt-2 text-[2rem] font-semibold leading-none text-[#4a6df6]">
              {coveredCount}<span className="ml-1 text-xl text-[#a4b4d8]">/ {totalProtectionLayers}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col">
        <div className="grid grid-cols-[minmax(0,1fr)_56px_56px] items-center gap-2.5 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a4b3c8] sm:grid-cols-[minmax(0,1fr)_64px_64px] sm:px-4">
          <span>Camada</span>
          <span className="text-center">Necessario</span>
          <span className="text-center">Coberto</span>
        </div>

        <div className="flex flex-col gap-3 pr-1">
          {protectionLayers.map((layer) => {
            const neededPath = `${statusPathMap.needed}.${layer.key}`;
            const coveredPath = `${statusPathMap.covered}.${layer.key}`;
            const hasAnyStatus = Boolean(layer.needed || layer.covered);
            const hasBothStatus = Boolean(layer.needed && layer.covered);
            const needsProtection = Boolean(layer.needed && !layer.covered);
            const accentClass = hasBothStatus ? 'bg-[#39b54a]' : needsProtection ? 'bg-[#f3b615]' : layer.covered ? 'bg-[#5c8dff]' : 'bg-[#9ec6ff]';

            return (
              <div
                key={layer.key}
                className={`relative min-h-[72px] rounded-[18px] border px-3 py-3 transition ${
                  hasAnyStatus ? 'border-[#e3ebf3] bg-white shadow-[0_12px_24px_rgba(23,61,93,0.06)]' : 'border-[#e7edf4] bg-white shadow-[0_10px_20px_rgba(23,61,93,0.04)]'
                } ${readOnly ? '' : 'hover:border-[#d8e5f2] hover:shadow-[0_14px_28px_rgba(23,61,93,0.08)]'}`}
              >
                <span aria-hidden="true" className={`absolute bottom-4 left-0 top-4 w-[5px] rounded-r-full ${accentClass}`} />
                <div className="grid min-h-[44px] grid-cols-[minmax(0,1fr)_56px_56px] items-center gap-2.5 pl-3 sm:grid-cols-[minmax(0,1fr)_64px_64px]">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.02em] text-[#3c4d68]">{layer.label}</p>
                  </div>

                  {readOnly ? (
                    <>
                      <StatusBadge label="Necessario" active={Boolean(layer.needed)} />
                      <StatusBadge label="Coberto" active={Boolean(layer.covered)} />
                    </>
                  ) : (
                    <>
                      <ToggleButton label="Necessario" active={Boolean(layer.needed)} fieldPath={neededPath} onFieldChange={onFieldChange} />
                      <ToggleButton label="Coberto" active={Boolean(layer.covered)} fieldPath={coveredPath} onFieldChange={onFieldChange} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[#edf2f7] px-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a4b3c8] sm:px-3">
          <span>{needCount} necessarias</span>
          <span>{coveredCount} cobertas</span>
          <span>Total de {totalProtectionLayers} camadas</span>
        </div>
      </div>
    </div>
  );
}
