export default function ResultCard({ result, formData, onReset }) {
  const isSuccess = result.error_code === 508

  if (!isSuccess) {
    return (
      <div className="border border-red-300 bg-red-50 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700 mb-1">Request Failed</p>
        <p className="text-[13px] text-red-600">{result.error_msg || 'Unknown error'} (Code: {result.error_code})</p>
        <button
          onClick={onReset}
          className="mt-4 px-4 h-8 bg-[#1b3f6b] text-white text-[12px] font-semibold uppercase tracking-wide hover:bg-[#15305a]"
        >
          Try Again
        </button>
      </div>
    )
  }

  const rows = [
    { label: 'Route', value: `${formData.sourceName || formData.sourceCountry}  →  ${formData.destinationName || formData.destinationCountry}` },
    { label: 'Service Type', value: formData.serviceType === 'domestic' ? 'Domestic' : 'International' },
    { label: 'Pieces', value: formData.pieces },
    { label: 'Dimensions (L × W × H)', value: `${formData.length} × ${formData.width} × ${formData.height} cm` },
    { label: 'Gross Weight', value: `${formData.grossWeight} kg` },
    { label: 'Volumetric Weight', value: `${((formData.length * formData.width * formData.height) / 5000).toFixed(2)} kg` },
    { label: 'Declared Value', value: `ZMW ${Number(formData.declaredValue).toLocaleString()}` },
    { label: 'Insurance', value: formData.insurance ? `ZMW ${(Number(formData.declaredValue) * 0.02).toFixed(2)} (2%)` : 'Not Applied' },
  ]

  return (
    <div className="flex flex-col gap-0">
      {/* Rate header */}
      <div className="bg-[#1b3f6b] px-5 py-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#7aaee0] font-semibold mb-1">Estimated Freight Charge</p>
          <p className="text-[36px] font-bold text-white leading-none tracking-tight">
            {Number(result.rate).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-[16px] font-normal text-[#7aaee0] ml-2">ZMW</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#7aaee0] uppercase tracking-wide">Status</p>
          <p className="text-[13px] font-semibold text-[#4ade80]">CONFIRMED</p>
        </div>
      </div>

      {/* Detail table */}
      <table className="w-full border border-t-0 border-[#c8cdd6] text-[13px]">
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.label} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f7f8fa]'}>
              <td className="px-4 py-2 text-[11px] uppercase tracking-wide text-[#4a5568] font-semibold border-r border-[#e2e5ea] w-44">
                {r.label}
              </td>
              <td className="px-4 py-2 text-[#1a2332] font-medium">{String(r.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-[#c8cdd6] mt-4">
        <button
          onClick={onReset}
          className="px-5 h-8 border border-[#b0b8c4] text-[#1a2332] text-[12px] font-semibold uppercase tracking-wide hover:bg-[#eef0f3]"
        >
          New Quote
        </button>
        <button
          onClick={() => window.print()}
          className="px-5 h-8 bg-[#1b3f6b] text-white text-[12px] font-semibold uppercase tracking-wide hover:bg-[#15305a]"
        >
          Print
        </button>
      </div>
    </div>
  )
}
