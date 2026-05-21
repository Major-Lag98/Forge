interface CatalogErrorViewProps {
  message: string
  onRetry: () => void
}

export function CatalogErrorView({ message, onRetry }: CatalogErrorViewProps): React.JSX.Element {
  return (
    <div className="catalog-status" role="alert">
      <h1 className="catalog-status-title">Couldn&rsquo;t load catalog</h1>
      <p className="catalog-status-body">{message}</p>
      <button type="button" className="catalog-retry" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
