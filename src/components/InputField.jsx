export default function InputField({ label, value, onChange, type = 'number', unit, min, step, required, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-[#4a5568]">
        {label}{required && <span className="text-red-600 ml-0.5">*</span>}
        {unit && <span className="ml-1 font-normal normal-case text-[#8a95a3]">({unit})</span>}
      </label>
      <div className="flex">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          step={step}
          placeholder={placeholder || ''}
          className="w-full h-8 px-2 text-[13px] border border-[#b0b8c4] bg-white text-[#1a2332]
            focus:border-[#1b3f6b] focus:ring-1 focus:ring-[#1b3f6b] outline-none"
        />
        {unit && (
          <span className="h-8 px-2 flex items-center text-[12px] text-[#4a5568] bg-[#eef0f3] border border-l-0 border-[#b0b8c4] whitespace-nowrap">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}
