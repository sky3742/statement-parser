function App() {
  const { toasts, toast } = useToast();
  const { accounts, accId, setAccId, cats, parsers, loadAccounts } = useApi(toast);
  const txn = useTransactions(toast);

  return e('div', { className: 'max-w-5xl mx-auto px-4 py-6' },
    e('div', { className: 'flex items-center justify-between mb-6' },
      e('div', null,
        e('h1', { className: 'text-xl font-bold tracking-tight' }, 'Statement Importer'),
        e('p', { className: 'text-xs text-base-content/40 mt-0.5' }, 'Import bank statements \u00B7 Edit \u00B7 Export or post to Maybe/Sure')
      ),
      e('div', { className: 'flex items-center gap-2' },
        accounts.length > 0 && e(AccountSelect, { accounts, value: accId, onChange: setAccId, onRefresh: loadAccounts }),
        e(ThemeSwitcher)
      )
    ),
    e(UploadZone, {
      onFiles: txn.handleFiles, count: txn.visible.length, loading: txn.loading,
      parsers, parser: txn.parser, onParserChange: txn.setParser
    }),
    txn.visible.length > 0 && e('div', { className: 'mt-4' },
      e(DateFilter, {
        dateFrom: txn.dateFrom, dateTo: txn.dateTo,
        onFromChange: txn.setDateFrom, onToChange: txn.setDateTo,
        onClear: () => { txn.setDateFrom(''); txn.setDateTo(''); }
      }),
      e(StatsBar, { rows: txn.filtered }),
      e(Toolbar, {
        selectedIds: txn.selIds, rows: txn.filtered, hasApi: accounts.length > 0,
        onCombine: () => txn.setShowCombine(true), onPost: () => txn.postSelected(accId),
        onRemove: txn.removeSelected, onClear: txn.clearAll, onExport: txn.exportCsv
      }),
      e(TTable, {
        rows: txn.filtered, categories: cats, selectedIds: txn.selIds,
        onToggle: txn.toggleRow, onToggleAll: txn.toggleAll, onUpdate: txn.updateRow
      })
    ),
    txn.showCombine && e(CombineModal, {
      rows: txn.rows, selectedIds: txn.selIds, categories: cats,
      onConfirm: txn.handleCombine, onClose: () => txn.setShowCombine(false)
    }),
    e(Toast, { toasts })
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
