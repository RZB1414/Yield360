import { useState } from 'react';
import { formatDate } from '../lib/formatters.js';

export function ContactHistory({ history = [], onEdit, onDelete }) {
  const [showAll, setShowAll] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editNotes, setEditNotes] = useState('');

  if (history.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-slate/15 bg-white/40 p-5 text-center text-sm text-slate/50">
        Nenhuma conversa registrada para este cliente.
      </div>
    );
  }

  const lastMessage = history[history.length - 1];
  const messagesToShow = showAll ? [...history].reverse() : [lastMessage];

  function handleEditClick(index, item) {
    setEditingIndex(index);
    setEditNotes(item.notes || '');
  }

  function handleEditSave(index, item) {
    onEdit?.(index, { ...item, notes: editNotes });
    setEditingIndex(null);
    setEditNotes('');
  }

  function handleEditCancel() {
    setEditingIndex(null);
    setEditNotes('');
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#355f9b]">Conversas e Interacoes</p>
        <p className="text-[10px] font-medium text-slate/40">{history.length} registro(s)</p>
      </div>
      <div className="grid max-h-[280px] gap-3 overflow-y-auto pr-1">
        {messagesToShow.map((item, index) => {
          const realIndex = showAll ? history.length - 1 - index : history.length - 1;
          const isEditing = editingIndex === realIndex;

          return (
            <div key={realIndex} className="rounded-[20px] border border-slate/8 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.result === 'success' ? 'bg-[#eef8f1] text-[#248a47]' : 'bg-[#fbe8e8] text-[#9f3518]'}`}>
                      {item.result === 'success' ? 'Sucesso' : 'Sem sucesso'}
                    </span>
                    <span className="text-xs font-semibold text-slate/40">{formatDate(item.date)}</span>
                  </div>
                  {isEditing ? (
                    <>
                      <textarea
                        className="mt-2 w-full rounded border border-slate/20 p-2 text-sm"
                        value={editNotes}
                        onChange={(event) => setEditNotes(event.target.value)}
                        rows={3}
                      />
                      <div className="mt-2 flex gap-2">
                        <button className="rounded bg-[#173d5d] px-3 py-1 text-xs text-white" onClick={() => handleEditSave(realIndex, item)} type="button">
                          Salvar
                        </button>
                        <button className="rounded bg-slate/10 px-3 py-1 text-xs text-slate" onClick={handleEditCancel} type="button">
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    item.notes && <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate/80">{item.notes}</p>
                  )}
                </div>
                {!isEditing ? (
                  <div className="flex flex-col items-end gap-1">
                    <button className="text-xs text-[#355f9b] hover:underline" onClick={() => handleEditClick(realIndex, item)} type="button">
                      Editar
                    </button>
                    <button className="text-xs text-[#c24d2c] hover:underline" onClick={() => onDelete?.(realIndex)} type="button">
                      Excluir
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {history.length > 1 ? (
        <button
          type="button"
          className="mt-2 self-end rounded-full border border-slate/15 bg-white px-4 py-2 text-xs font-semibold text-slate transition hover:border-slate/30"
          onClick={() => setShowAll((currentValue) => !currentValue)}
        >
          {showAll ? 'Mostrar menos' : 'Mostrar todo o historico'}
        </button>
      ) : null}
    </div>
  );
}
