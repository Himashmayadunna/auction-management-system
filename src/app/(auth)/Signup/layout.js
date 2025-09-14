export default function AuthLayout({ children }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 dark:bg-gray-900">
      {children}
    </div>
  )
}