// === useToast ===
function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type: type || '' }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  return { toasts, toast };
}

// === useApi ===
function useApi(toast) {
  const [accounts, setAccounts] = useState([]);
  const [accId, setAccId] = useState('');
  const [cats, setCats] = useState([]);
  const [parsers, setParsers] = useState([]);

  useEffect(() => {
    loadAccounts();
    fetch('/api/parsers').then(r => r.json()).then(d => setParsers(d.parsers || [])).catch(() => {});
  }, []);

  function loadAccounts() {
    Promise.all([fetch('/api/v1/accounts'), fetch('/api/v1/categories')])
      .then(resps => {
        if (!resps[0].ok) throw new Error(resps[0].status);
        return Promise.all([resps[0].json(), resps[1].ok ? resps[1].json() : { categories: [] }]);
      })
      .then(ds => {
        const accs = ds[0].accounts || [];
        const categories = ds[1].categories || [];
        setAccounts(accs);
        if (accs.length) setAccId(accs[0].id);
        setCats(categories);
        if (accs.length) toast(`Connected \u2014 ${categories.length} categories`, 'success');
      })
      .catch(() => {});
  }

  return { accounts, accId, setAccId, cats, parsers, loadAccounts };
}

// === useTransactions ===
function useTransactions(toast) {
  const [rows, setRows] = useState([]);
  const [nid, setNid] = useState(1);
  const [selIds, setSelIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [parser, setParser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCombine, setShowCombine] = useState(false);
  const [sort, setSort] = useState({ field: 'date', dir: 'asc' });

  // Visible = not combined away
  const visible = rows.filter(r => !r.combined);

  // Filtered = date range
  const filtered = visible.filter(r => {
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    return true;
  });

  // Sorted
  const sorted = [...filtered].sort((a, b) => {
    let va = a[sort.field], vb = b[sort.field];
    if (sort.field === 'amount') { va = a.type === 'income' ? -a.amount : a.amount; vb = b.type === 'income' ? -b.amount : b.amount; }
    if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb || '').toLowerCase(); }
    if (va < vb) return sort.dir === 'asc' ? -1 : 1;
    if (va > vb) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  function toggleSort(field) {
    setSort(p => p.field === field ? { field, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });
  }

  // === Upload ===
  function handleFiles(files) {
    let count = 0;
    const total = [...files].filter(f => f.type === 'application/pdf').length;
    if (!total) return;
    setLoading(true);

    for (const f of files) {
      if (f.type !== 'application/pdf') continue;
      const form = new FormData();
      form.append('files', f);
      const qs = parser ? `?parser=${parser}` : '';
      fetch('/extract-pdf' + qs, { method: 'POST', body: form })
        .then(r => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(d => {
          if (d.error) throw new Error(d.error);
          const baseId = nid;
          const nr = d.transactions.map((t, i) => ({
            id: baseId + i, date: t.date, amount: t.amount, type: t.type,
            desc: t.desc, name: t.desc, category: '', notes: '',
            combined: false, combinedWith: [], posted: false
          }));
          setRows(p => [...p, ...nr]);
          setNid(baseId + d.transactions.length);
          toast(`${f.name}: ${d.transactions.length} transactions`, 'success');
        })
        .catch(e => toast('PDF extraction failed: ' + e.message, 'error'))
        .finally(() => { count++; if (count >= total) setLoading(false); });
    }
  }

  // === Edit ===
  function updateRow(id, field, val) {
    setRows(p => p.map(r => r.id === id ? { ...r, [field]: val } : r));
  }

  // === Selection ===
  function toggleRow(id) {
    setSelIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  }

  function toggleAll() {
    setSelIds(p => p.length === sorted.length ? [] : sorted.map(r => r.id));
  }

  // === Combine ===
  function handleCombine(c) {
    const sel = rows.filter(r => selIds.includes(r.id));
    const comb = {
      id: nid, date: sel[0].date, amount: Math.abs(c.net),
      type: c.net >= 0 ? 'expense' : 'income',
      desc: c.name, name: c.name, category: c.category, notes: c.notes,
      combined: false, combinedWith: sel.map(r => r.id), posted: false
    };
    setRows(p => [
      ...p.map(r => selIds.includes(r.id) ? { ...r, combined: true } : r),
      comb
    ]);
    setNid(p => p + 1);
    setSelIds([]);
    setShowCombine(false);
    toast(`Combined ${sel.length} items as "${c.name}"`, 'success');
  }

  // === Bulk category ===
  function bulkCategory(catId) {
    setRows(p => p.map(r => selIds.includes(r.id) ? { ...r, category: catId } : r));
    toast(`Updated ${selIds.length} rows`, 'success');
  }

  // === Batch post ===
  function postSelected(accId) {
    const sel = rows.filter(r => selIds.includes(r.id) && !r.posted);
    if (!sel.length) return;
    if (!accId) { toast('Select account first', 'error'); return; }

    setPosting(true);
    const transactions = sel.map(r => ({
      account_id: accId, date: r.date, amount: r.amount.toFixed(2),
      name: r.name || r.desc, classification: r.type,
      category_id: r.category || undefined, notes: r.notes || undefined
    }));

    fetch('/api/v1/transactions/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions })
    })
      .then(r => r.json())
      .then(d => {
        const okIds = new Set((d.created || []).map(t => t.client_id).filter(Boolean));
        setRows(p => p.map(r => okIds.has(r.id) ? { ...r, posted: true } : r));
        const ok = okIds.size;
        const fail = sel.length - ok;
        toast(`Posted ${ok} transactions${fail ? `, ${fail} failed` : ''}`, ok ? 'success' : 'error');
      })
      .catch(e => toast('Batch post failed: ' + e.message, 'error'))
      .finally(() => setPosting(false));
  }

  // === Export ===
  function exportCsv() {
    const data = sorted.length ? sorted : visible;
    if (!data.length) { toast('Nothing to export', 'error'); return; }
    const lines = ['Date,Amount,Type,Description,Category,Notes'];
    data.forEach(r => {
      lines.push(`${r.date},${r.amount.toFixed(2)},${r.type},"${(r.desc||'').replace(/"/g,'""')}","${(r.category||'').replace(/"/g,'""')}","${(r.notes||'').replace(/"/g,'""')}"`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast(`Exported ${data.length} transactions`, 'success');
  }

  // === Clear / Remove ===
  function clearAll() {
    setRows([]); setNid(1); setSelIds([]);
    setDateFrom(''); setDateTo('');
    toast('Cleared', 'success');
  }

  function removeSelected() {
    setRows(p => p.filter(r => !selIds.includes(r.id)));
    setSelIds([]);
    toast('Removed selected', 'success');
  }

  return {
    rows, visible, filtered, sorted, selIds, loading, posting, parser, setParser,
    sort, toggleSort,
    dateFrom, setDateFrom, dateTo, setDateTo,
    showCombine, setShowCombine,
    handleFiles, updateRow, toggleRow, toggleAll,
    handleCombine, bulkCategory, postSelected, exportCsv, clearAll, removeSelected
  };
}
