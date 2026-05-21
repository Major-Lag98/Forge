export function CatalogLoadingView(): React.JSX.Element {
  return (
    <div className="catalog-status" role="status">
      <h1 className="catalog-status-title">Loading catalog…</h1>
      <p className="catalog-status-body">Fetching the game list from the remote manifest.</p>
    </div>
  )
}
