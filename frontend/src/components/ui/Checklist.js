export function Checklist({ children }) {
  return (
    <div className="space-y-2">
      {children}
    </div>
  );
}

export function CheckItem({ children, checked = false }) {
  return (
    <div className="flex items-start">
      <div className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center mt-0.5 ${
        checked ? 'bg-green-500 border-green-500' : 'border-gray-300'
      }`}>
        {checked && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="ml-3 text-sm text-gray-700">{children}</span>
    </div>
  );
}

export default Checklist;

