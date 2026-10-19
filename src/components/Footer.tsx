'use client'

export default function Footer() {
  return (
    <footer className="w-full max-w-5xl mx-auto px-6 pt-10 pb-8 mt-6 select-none relative">
      {/* Gradient top separator */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-200/80 to-transparent mb-8" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-xs font-medium">
        <div className="flex items-center gap-3">
          <span className="text-lg" aria-hidden="true">📚</span>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-neutral-900 text-[13px]">LitHub</span>
            <span className="text-neutral-300">·</span>
            <span className="text-neutral-500 text-[11.5px]">Your Personal Reading Sanctuary</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-neutral-400">
          <span>© {new Date().getFullYear()} LitHub</span>
          <span className="text-neutral-200">|</span>
          <span className="italic">Crafted for passionate readers.</span>
        </div>
      </div>
    </footer>
  )
}
