
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-9xl font-black text-gray-200 dark:text-gray-800 select-none">403</h1>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Accès Refusé
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Link
            href="/"
            className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors font-medium"
          >
            Changer de compte
          </Link>
        </div>
      </div>
    </div>
  )
}
