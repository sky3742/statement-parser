// === ThemeSwitcher ===
function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'winter');
  const ref = React.useRef(null);

  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function change(t) {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    setOpen(false);
  }

  return e('div', { ref, className: 'relative' },
    e('button', { onClick: () => setOpen(!open), className: 'btn btn-ghost btn-sm btn-square' },
      e('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'w-4 h-4', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
        e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' })
      )
    ),
    open && e('ul', { className: 'absolute right-0 top-full mt-1 bg-base-200 rounded-box z-[999] w-52 p-2 shadow-2xl max-h-80 overflow-y-auto border border-base-300' },
      THEMES.map(t =>
        e('li', { key: t },
          e('button', {
            onClick: () => change(t),
            className: `flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-lg ${theme === t ? 'bg-primary/10 text-primary' : 'hover:bg-base-300'}`
          },
            e('div', { 'data-theme': t, className: 'w-4 h-4 rounded-full bg-primary' }),
            t.charAt(0).toUpperCase() + t.slice(1)
          )
        )
      )
    )
  );
}

// === Toast ===
function Toast({ toasts }) {
  return e('div', { className: 'toast toast-end z-50 flex flex-col gap-2' },
    toasts.map(t =>
      e('div', {
        key: t.id,
        className: `alert shadow-lg border-0 animate-slide-up ${
          t.type === 'error' ? 'bg-error/90 text-error-content' :
          t.type === 'success' ? 'bg-success/90 text-success-content' :
          'bg-info/90 text-info-content'
        }`
      },
        t.type === 'error' ? e('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'stroke-current shrink-0 w-5 h-5', fill: 'none', viewBox: '0 0 24 24' },
          e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' })
        ) : t.type === 'success' ? e('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'stroke-current shrink-0 w-5 h-5', fill: 'none', viewBox: '0 0 24 24' },
          e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
        ) : null,
        e('span', null, t.msg)
      )
    )
  );
}

// === AccountSelect ===
function AccountSelect({ accounts, value, onChange, onRefresh }) {
  return e('div', { className: 'flex gap-2 items-center' },
    e('select', {
      value,
      onChange: v => onChange(v.target.value),
      className: 'select select-sm bg-base-200 min-w-[200px]'
    },
      accounts.map(a => e('option', { key: a.id, value: a.id }, a.name))
    ),
    e('button', { onClick: onRefresh, className: 'btn btn-ghost btn-sm btn-square' },
      e('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'w-4 h-4', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
        e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
      )
    )
  );
}

// === UploadZone ===
function UploadZone({ onFiles, count, loading, parsers, parser, onParserChange }) {
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback(ev => {
    ev.preventDefault();
    setDrag(false);
    onFiles(ev.dataTransfer.files);
  }, [onFiles]);

  if (loading) {
    return e('div', { className: 'rounded-xl border-2 border-dashed border-primary/30 bg-base-200/50 py-10 px-6 text-center' },
      e('span', { className: 'loading loading-spinner loading-md text-primary' }),
      e('p', { className: 'text-sm text-base-content/60 mt-3' }, 'Extracting transactions...')
    );
  }

  return e('div', {
    onClick: () => document.getElementById('fi').click(),
    onDragOver: ev => { ev.preventDefault(); setDrag(true); },
    onDragLeave: () => setDrag(false),
    onDrop: handleDrop,
    className: `relative overflow-hidden rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
      drag
        ? 'border-primary bg-primary/5 scale-[1.01]'
        : 'border-base-300 bg-base-200/50 hover:border-primary/50 hover:bg-base-200'
    } ${count ? 'py-4 px-6' : 'py-10 px-6'}`
  },
    count ? e('div', { className: 'flex items-center justify-between' },
      e('div', { className: 'flex items-center gap-3' },
        e('div', { className: 'w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center' },
          e('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'w-4 h-4 text-primary', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
            e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
          )
        ),
        e('div', null,
          e('p', { className: 'text-sm font-medium' }, 'Add more PDFs'),
          e('p', { className: 'text-xs text-base-content/50' }, 'or drop files here')
        )
      ),
      parsers.length > 1 && e('select', {
        value: parser, onChange: ev => { ev.stopPropagation(); onParserChange(ev.target.value); },
        onClick: ev => ev.stopPropagation(),
        className: 'select select-xs w-auto'
      },
        e('option', { value: '' }, 'Auto-detect'),
        parsers.map(p => e('option', { key: p.name, value: p.name }, p.label))
      )
    ) : e('div', { className: 'text-center' },
      e('div', { className: 'w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3' },
        e('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'w-6 h-6 text-primary', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.5 },
          e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' })
        )
      ),
      e('p', { className: 'text-sm font-medium mb-1' }, 'Drop statements here'),
      e('p', { className: 'text-xs text-base-content/40' }, 'Supports multiple PDF files'),
      parsers.length > 1 && e('div', { className: 'mt-3 flex justify-center', onClick: ev => ev.stopPropagation() },
        e('select', {
          value: parser, onChange: ev => onParserChange(ev.target.value),
          className: 'select select-xs'
        },
          e('option', { value: '' }, 'Auto-detect'),
          parsers.map(p => e('option', { key: p.name, value: p.name }, p.label))
        )
      )
    ),
    e('input', { id: 'fi', type: 'file', accept: '.pdf', multiple: true, className: 'hidden', onChange: ev => { onFiles(ev.target.files); ev.target.value = ''; } })
  );
}

// === DateFilter ===
function DateFilter({ dateFrom, dateTo, onFromChange, onToChange, onClear }) {
  const active = dateFrom || dateTo;
  return e('div', { className: 'flex gap-2 items-center mb-3' },
    e('label', { className: 'text-xs text-base-content/50' }, 'Date:'),
    e('input', { type: 'date', value: dateFrom, onChange: ev => onFromChange(ev.target.value), className: 'input input-xs w-auto' }),
    e('span', { className: 'text-xs text-base-content/30' }, '\u2014'),
    e('input', { type: 'date', value: dateTo, onChange: ev => onToChange(ev.target.value), className: 'input input-xs w-auto' }),
    active && e('button', { onClick: onClear, className: 'btn btn-ghost btn-xs' }, 'Clear')
  );
}

// === Toolbar ===
function Toolbar({ selectedIds, rows, categories, hasApi, onCombine, onPost, onRemove, onClear, onExport, onBulkCategory }) {
  const sel = rows.filter(r => selectedIds.includes(r.id));
  const net = sel.reduce((s, r) => s + (r.type === 'expense' ? r.amount : -r.amount), 0);
  const hasSelection = selectedIds.length > 0;

  return e('div', { className: 'flex gap-2 items-center mb-3 flex-wrap' },
    e('button', { onClick: onExport, className: 'btn btn-ghost btn-sm gap-2' },
      e('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'w-4 h-4', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
        e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
      ),
      'Export'
    ),
    e('span', { className: 'flex-1' }),
    hasSelection && e('div', { className: 'flex items-center gap-2 animate-slide-down' },
      e('span', { className: 'badge badge-soft badge-sm' }, `${selectedIds.length} selected`),
      e('span', { className: `badge badge-sm ${net >= 0 ? 'badge-error' : 'badge-success'} badge-dash` }, `RM${net.toFixed(2)}`),
      categories.length > 0 && e('select', {
        onChange: ev => { if (ev.target.value) { onBulkCategory(ev.target.value); ev.target.value = ''; } },
        className: 'select select-xs w-auto',
        defaultValue: ''
      },
        e('option', { value: '', disabled: true }, 'Set category'),
        categories.map(c => e('option', { key: c.id, value: c.id }, c.name))
      ),
      e('button', { onClick: onRemove, className: 'btn btn-ghost btn-xs text-error' }, 'Remove'),
    ),
    e('button', { onClick: onCombine, disabled: selectedIds.length < 2, className: 'btn btn-outline btn-sm gap-2' },
      e('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'w-4 h-4', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
        e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' })
      ),
      'Merge'
    ),
    hasApi && e('button', { onClick: onPost, disabled: selectedIds.length === 0, className: 'btn btn-primary btn-sm gap-2' },
      e('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'w-4 h-4', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
        e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' })
      ),
      'Post'
    ),
    e('div', { className: 'dropdown dropdown-end' },
      e('div', { tabIndex: 0, role: 'button', className: 'btn btn-ghost btn-sm btn-square' },
        e('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'w-4 h-4', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
          e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z' })
        )
      ),
      e('ul', { tabIndex: 0, className: 'dropdown-content bg-base-200 rounded-box z-[999] w-36 p-1 shadow-xl border border-base-300' },
        e('li', null, e('button', { onClick: onClear, className: 'w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-base-300 text-error' }, 'New / Clear'))
      )
    )
  );
}
function StatsBar({ rows }) {
  if (!rows.length) return null;
  const dates = rows.map(r => r.date).sort();
  const exp = rows.filter(r => r.type === 'expense');
  const inc = rows.filter(r => r.type === 'income');
  const totalExp = exp.reduce((s, r) => s + r.amount, 0);
  const totalInc = inc.reduce((s, r) => s + r.amount, 0);

  const items = [
    { label: 'Transactions', value: rows.length, color: '' },
    { label: 'Expenses', value: exp.length, sub: `RM${totalExp.toFixed(2)}`, color: 'text-error' },
    { label: 'Income', value: inc.length, sub: `RM${totalInc.toFixed(2)}`, color: 'text-success' },
    { label: 'Period', value: `${dates[0]} \u2192 ${dates[dates.length - 1]}`, color: '', small: true },
  ];

  return e('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 animate-fade-in' },
    items.map((it, i) =>
      e('div', { key: i, className: 'bg-base-100 rounded-xl p-4 border border-base-300/50' },
        e('p', { className: 'text-[11px] text-base-content/40 uppercase tracking-wider mb-1' }, it.label),
        e('p', { className: `${it.small ? 'text-sm' : 'text-2xl'} font-semibold ${it.color}` }, it.value),
        it.sub && e('p', { className: 'text-xs text-base-content/50 mt-0.5' }, it.sub)
      )
    )
  );
}

// === TransactionRow ===
function TRow({ r, categories, selected, onToggle, onUpdate }) {
  const amtClass = r.type === 'expense' ? 'text-error' : 'text-success';
  const prefix = r.type === 'income' ? '+' : '-';

  return e('tr', { className: `${r.posted ? 'opacity-30' : ''} ${selected ? 'bg-primary/[0.04]' : 'hover:bg-base-300/30'}` },
    e('td', { className: 'w-[40px]' },
      e('input', { type: 'checkbox', checked: selected, onChange: () => onToggle(r.id), className: 'checkbox checkbox-xs checkbox-primary' })
    ),
    e('td', { className: 'whitespace-nowrap text-sm text-base-content/70 font-medium' }, r.date),
    e('td', { className: `text-right whitespace-nowrap font-semibold tabular-nums ${amtClass}` },
      `${prefix}RM${r.amount.toFixed(2)}`
    ),
    e('td', null,
      e('input', {
        value: r.desc,
        onChange: v => onUpdate(r.id, 'desc', v.target.value),
        className: 'w-full bg-transparent border-0 outline-none text-sm focus:ring-1 focus:ring-primary/30 rounded px-1.5 py-0.5 -ml-1.5 transition-all'
      })
    ),
    e('td', { className: 'min-w-[140px]' },
      e('select', {
        value: r.category,
        onChange: v => onUpdate(r.id, 'category', v.target.value),
        className: 'w-full bg-transparent border-0 outline-none text-sm cursor-pointer focus:ring-1 focus:ring-primary/30 rounded px-1 py-0.5'
      },
        e('option', { value: '' }, '\u2014'),
        categories.map(c => e('option', { key: c.id, value: c.id }, c.name))
      )
    ),
    e('td', null,
      e('input', {
        value: r.notes,
        onChange: v => onUpdate(r.id, 'notes', v.target.value),
        placeholder: '\u2014',
        className: 'w-full bg-transparent border-0 outline-none text-sm text-base-content/50 focus:ring-1 focus:ring-primary/30 rounded px-1.5 py-0.5 -ml-1.5 transition-all'
      })
    )
  );
}

// === SortableHeader ===
function SortHeader({ label, field, sort, onSort, align }) {
  const active = sort.field === field;
  const arrow = active ? (sort.dir === 'asc' ? ' \u25B2' : ' \u25BC') : '';
  const cls = `text-xs font-medium uppercase tracking-wider cursor-pointer select-none hover:text-base-content ${active ? 'text-base-content' : 'text-base-content/40'} ${align === 'right' ? 'text-right' : ''}`;
  return e('th', { className: cls, onClick: () => onSort(field) }, label + arrow);
}

// === VirtualTable ===
const ROW_H = 37;
function TTable({ rows, categories, selectedIds, sort, onSort, onToggle, onToggleAll, onUpdate }) {
  if (!rows.length) return null;
  const all = rows.length > 0 && selectedIds.length === rows.length;
  const [scrollTop, setScrollTop] = useState(0);
  const containerH = 480;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_H) - 5);
  const endIdx = Math.min(rows.length, Math.ceil((scrollTop + containerH) / ROW_H) + 5);
  const visibleRows = rows.slice(startIdx, endIdx);

  return e('div', { className: 'bg-base-100 rounded-xl border border-base-300/50 overflow-hidden animate-fade-in' },
    e('div', {
      className: 'overflow-x-auto overflow-y-auto',
      style: { maxHeight: containerH + 'px' },
      onScroll: ev => setScrollTop(ev.currentTarget.scrollTop)
    },
      e('table', { className: 'table table-sm' },
        e('thead', { className: 'sticky top-0 z-10' },
          e('tr', { className: 'bg-base-100 border-b border-base-300/50' },
            e('th', { className: 'w-[40px]' }, e('input', { type: 'checkbox', checked: all, onChange: onToggleAll, className: 'checkbox checkbox-xs checkbox-primary' })),
            e(SortHeader, { label: 'Date', field: 'date', sort, onSort }),
            e(SortHeader, { label: 'Amount', field: 'amount', sort, onSort, align: 'right' }),
            e(SortHeader, { label: 'Description', field: 'desc', sort, onSort }),
            e('th', { className: 'text-xs font-medium text-base-content/40 uppercase tracking-wider' }, 'Category'),
            e('th', { className: 'text-xs font-medium text-base-content/40 uppercase tracking-wider' }, 'Notes')
          )
        ),
        e('tbody', null,
          startIdx > 0 && e('tr', { style: { height: startIdx * ROW_H + 'px' } }, e('td', { colSpan: 6 })),
          visibleRows.map(r =>
            e(TRow, { key: r.id, r, categories, selected: selectedIds.includes(r.id), onToggle, onUpdate })
          ),
          endIdx < rows.length && e('tr', { style: { height: (rows.length - endIdx) * ROW_H + 'px' } }, e('td', { colSpan: 6 }))
        )
      )
    )
  );
}

// === CombineModal ===
function CombineModal({ rows, selectedIds, categories, onConfirm, onClose }) {
  const sel = rows.filter(r => selectedIds.includes(r.id));
  const exp = sel.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const inc = sel.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const net = Math.round((exp - inc) * 100) / 100;

  const [name, setName] = useState('');
  const [cat, setCat] = useState(sel[0] ? sel[0].category : '');
  const [notes, setNotes] = useState('');

  return e('dialog', { className: 'modal modal-open' },
    e('div', { className: 'modal-box bg-base-100 border border-base-300/50 max-w-md animate-slide-up' },
      e('h3', { className: 'font-bold text-lg mb-4' }, 'Merge Transactions'),
      e('div', { className: 'bg-base-200/50 rounded-lg p-4 mb-4 border border-base-300/30' },
        e('div', { className: 'space-y-1 font-mono text-xs text-base-content/70 mb-3' },
          sel.map((r, i) => e('div', { key: i, className: 'flex justify-between' },
            e('span', null, `${r.date} \u00B7 ${r.desc}`),
            e('span', { className: r.type === 'expense' ? 'text-error' : 'text-success' },
              `${r.type === 'expense' ? '-' : '+'}RM${r.amount.toFixed(2)}`
            )
          ))
        ),
        e('div', { className: 'divider my-2' }),
        e('div', { className: 'flex justify-between font-semibold text-sm' },
          e('span', null, `${sel.length} items`),
          e('span', { className: net >= 0 ? 'text-error' : 'text-success' }, `RM${net.toFixed(2)}`)
        )
      ),
      e('fieldset', { className: 'mb-3' },
        e('legend', { className: 'text-xs text-base-content/50 mb-1' }, 'Name'),
        e('input', { value: name, onChange: v => setName(v.target.value), placeholder: 'e.g. Bazaar, \u7EA2\u5305', autoFocus: true, className: 'input input-sm w-full' })
      ),
      e('fieldset', { className: 'mb-3' },
        e('legend', { className: 'text-xs text-base-content/50 mb-1' }, 'Category'),
        e('select', { value: cat, onChange: v => setCat(v.target.value), className: 'select select-sm w-full' },
          e('option', { value: '' }, '\u2014'),
          categories.map(c => e('option', { key: c.id, value: c.id }, c.name))
        )
      ),
      e('fieldset', { className: 'mb-4' },
        e('legend', { className: 'text-xs text-base-content/50 mb-1' }, 'Notes'),
        e('input', { value: notes, onChange: v => setNotes(v.target.value), placeholder: 'Optional', className: 'input input-sm w-full' })
      ),
      e('div', { className: 'modal-action' },
        e('button', { onClick: onClose, className: 'btn btn-ghost btn-sm' }, 'Cancel'),
        e('button', {
          onClick: () => {
            if (!name.trim()) return;
            onConfirm({ name: name.trim(), category: cat, notes: notes.trim(), net });
          },
          className: 'btn btn-primary btn-sm'
        }, 'Merge')
      )
    ),
    e('form', { method: 'dialog', className: 'modal-backdrop bg-black/50 backdrop-blur-sm' },
      e('button', { onClick: onClose })
    )
  );
}
