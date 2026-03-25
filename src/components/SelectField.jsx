export default function SelectField({ label, value, onChange, options, placeholder, disabled, required }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-[#4a5568]">
        {label}{required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full h-8 px-2 text-[13px] border bg-white outline-none
          ${disabled
            ? 'border-[#dde1e7] text-[#a0aab4] cursor-not-allowed bg-[#f5f6f8]'
            : 'border-[#b0b8c4] text-[#1a2332] focus:border-[#1b3f6b] focus:ring-1 focus:ring-[#1b3f6b]'
          }`}
      >
        <option value="">{placeholder || '-- Select --'}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
