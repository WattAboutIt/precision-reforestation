/* PageShell.jsx - Shared layout wrapper for all inner pages */

const pageShellStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
  .ps-root { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: #f0fdf4; }
  .ps-header {
    background: white; border-bottom: 1px solid #dcfce7;
    padding: 24px 32px;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  }
  .ps-title-wrap {}
  .ps-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 700; color: #052e16;
  }
  .ps-subtitle { font-size: 0.875rem; color: #4b7a59; margin-top: 4px; max-width: 540px; line-height: 1.5; }
  .ps-body { padding: 28px 32px; }
  .ps-loading {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 300px; gap: 16px;
  }
  .ps-spinner {
    width: 40px; height: 40px; border: 3px solid #dcfce7;
    border-top-color: #16a34a; border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  .ps-loading-text { font-size: 0.875rem; color: #4b7a59; }
  .ps-error {
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 16px; padding: 16px 20px; color: #dc2626; font-size: 0.875rem;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 768px) {
    .ps-header { padding: 16px 20px; }
    .ps-body { padding: 20px; }
  }
`;

export default function PageShell({ title, subtitle, loading, error, action, children }) {
  return (
    <>
      <style>{pageShellStyles}</style>
      <div className="ps-root">
        <div className="ps-header">
          <div className="ps-title-wrap">
            <h1 className="ps-title">{title}</h1>
            {subtitle && <p className="ps-subtitle">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
        <div className="ps-body">
          {loading ? (
            <div className="ps-loading">
              <div className="ps-spinner" />
              <div className="ps-loading-text">Loading {title.toLowerCase()} data…</div>
            </div>
          ) : error ? (
            <div className="ps-error">⚠ {error}</div>
          ) : (
            children
          )}
        </div>
      </div>
    </>
  );
}
