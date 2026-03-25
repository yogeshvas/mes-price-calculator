export default function StepIndicator({ steps, current }) {
  return (
    <div className="flex border-b border-[#c8cdd6] mb-6">
      {steps.map((label, i) => {
        const idx = i + 1
        const done = idx < current
        const active = idx === current
        return (
          <div
            key={label}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wide border-b-2 -mb-px
              ${active ? 'border-[#1b3f6b] text-[#1b3f6b]' : done ? 'border-transparent text-[#4a7ab5]' : 'border-transparent text-[#8a95a3]'}`}
          >
            <span
              className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold border
                ${active ? 'bg-[#1b3f6b] border-[#1b3f6b] text-white' : done ? 'bg-[#4a7ab5] border-[#4a7ab5] text-white' : 'bg-white border-[#c8cdd6] text-[#8a95a3]'}`}
            >
              {done ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : idx}
            </span>
            {label}
          </div>
        )
      })}
    </div>
  )
}
