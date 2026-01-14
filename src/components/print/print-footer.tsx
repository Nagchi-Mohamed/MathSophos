export function PrintFooter() {
  const platformName = "MathSophos"
  const platformUrl = "www.mathsophos.com"

  return (
    <div className="mt-12 pt-6 border-t-2 border-black print:border-black">
      <div className="text-center space-y-1">
        <div className="font-bold text-lg text-black">{platformName}</div>
        <div className="text-sm text-gray-600">{platformUrl}</div>
      </div>
    </div>
  )
}
