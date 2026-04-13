import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'

export default function ResultCard({ result, formData, onReset }) {
  const cardRef = useRef(null)
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  async function handleSave() {
    if (!cardRef.current) return
    setGenerating(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const dataUrl = canvas.toDataURL('image/png')

      // Try normal download first (works in regular browsers)
      const link = document.createElement('a')
      link.download = 'freight-quote.png'
      link.href = dataUrl
      link.click()

      // Also show the preview overlay (helps in-app browsers like WhatsApp)
      setPreviewUrl(dataUrl)
    } finally {
      setGenerating(false)
    }
  }
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
      {/* Captured area */}
      <div ref={cardRef} className="flex flex-col gap-0">
      {/* Rate header */}
      <div className="bg-[#1b3f6b] px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-0">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#7aaee0] font-semibold mb-1">Estimated Freight Charge</p>
          <p className="text-[28px] sm:text-[36px] font-bold text-white leading-none tracking-tight">
            {Number(result.rate).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-[14px] sm:text-[16px] font-normal text-[#7aaee0] ml-2">ZMW</span>
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-[11px] text-[#7aaee0] uppercase tracking-wide">Status</p>
          <p className="text-[13px] font-semibold text-[#4ade80]">CONFIRMED</p>
        </div>
      </div>

      {/* Detail table */}
      <div className="border border-t-0 border-[#c8cdd6] overflow-x-auto">
        <table className="w-full text-[12px] sm:text-[13px] min-w-[300px]">
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f7f8fa]'}>
                <td className="px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] uppercase tracking-wide text-[#4a5568] font-semibold border-r border-[#e2e5ea] w-32 sm:w-44">
                  {r.label}
                </td>
                <td className="px-3 sm:px-4 py-2 text-[#1a2332] font-medium break-words">{String(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      </div>{/* end captured area */}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-[#c8cdd6] mt-4">
        <button
          onClick={onReset}
          className="w-full sm:w-auto px-5 h-9 border border-[#b0b8c4] text-[#1a2332] text-[12px] font-semibold uppercase tracking-wide hover:bg-[#eef0f3]"
        >
          New Quote
        </button>
        <button
          onClick={handleSave}
          disabled={generating}
          className="w-full sm:w-auto px-5 h-9 bg-[#1b3f6b] text-white text-[12px] font-semibold uppercase tracking-wide hover:bg-[#15305a] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {generating && (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {generating ? 'Generating...' : 'Save as Image'}
        </button>
      </div>

      {/* Image preview overlay — for in-app browsers (WhatsApp etc.) that block downloads */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4 gap-4"
          onClick={() => setPreviewUrl(null)}
        >
          <p className="text-white text-[13px] font-semibold text-center">
            Hold / long-press the image below to save it
          </p>
          <img
            src={previewUrl}
            alt="Freight quote"
            className="max-w-full max-h-[75vh] rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewUrl(null)}
            className="text-white text-[12px] uppercase tracking-wide border border-white/40 px-4 h-8 hover:bg-white/10"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
