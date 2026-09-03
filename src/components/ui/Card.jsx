export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-neutral-200/80 p-4 ${className}`}>
      {children}
    </div>
  );
}
