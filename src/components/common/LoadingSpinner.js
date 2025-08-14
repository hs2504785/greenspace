export default function LoadingSpinner() {
  return (
    <div className="container d-flex justify-content-center align-items-center py-5">
      <div className="text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading vegetables...</p>
      </div>
    </div>
  );
}
