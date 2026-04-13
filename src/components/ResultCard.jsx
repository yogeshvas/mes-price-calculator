import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'

export default function ResultCard({ result, formData, onReset }) {
  const cardRef = useRef(null)
  const [generating, setGenerating] = useState(false)
  const [screenshotMode, setScreenshotMode] = useState(false)

  async function handleSave() {
    if (!cardRef.current) return
    setGenerating(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'freight-quote.png', { type: 'image/png' })

        // 1. Try native share sheet (works on many mobile browsers)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Freight Quote' })
            setGenerating(false)
            return
          } catch {
            // cancelled or not supported — fall through
          }
        }

        // 2. Try direct download (works on desktop + standard mobile browsers)
        try {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = 'freight-quote.png'
          link.href = url
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          setTimeout(() => URL.revokeObjectURL(url), 1000)
          setGenerating(false)
          return
        } catch {
          // fall through
        }

        // 3. Last resort: screenshot mode
        setGenerating(false)
        setScreenshotMode(true)
      }, 'image/png')
    } catch {
      setGenerating(false)
      setScreenshotMode(true)
    }
  }

  const isSuccess = result.error_code === 508

  if (!isSuccess) {
    return (
      <div className="border border-red-300 bg-red-50 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700 mb-1">Request Failed</p>
        <p className="text-[13px] text-red-600">{result.error_msg || 'Unknown error'} (Code: {result.error_code})</p>
        <button onClick={onReset} className="mt-4 px-4 h-8 bg-[#1b3f6b] text-white text-[12px] font-semibold uppercase tracking-wide hover:bg-[#15305a]">
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

  // Screenshot mode: full screen, only the card visible
  if (screenshotMode) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Instruction bar */}
        <div className="bg-[#1b3f6b] px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <p className="text-white text-[12px] font-semibold">
            Take a screenshot now to save
          </p>
          <button
            onClick={() => setScreenshotMode(false)}
            className="text-[#7aaee0] text-[12px] underline shrink-0"
          >
            Done
          </button>
        </div>

        {/* Card only — no buttons */}
        <div className="flex-1 overflow-auto">
          <div className="bg-[#1b3f6b] px-4 py-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-0">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[#7aaee0] font-semibold mb-1">Estimated Freight Charge</p>
              <p className="text-[28px] font-bold text-white leading-none tracking-tight">
                {Number(result.rate).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-[14px] font-normal text-[#7aaee0] ml-2">ZMW</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#7aaee0] uppercase tracking-wide">Status</p>
              <p className="text-[13px] font-semibold text-[#4ade80]">CONFIRMED</p>
            </div>
          </div>

          <table className="w-full text-[13px] border border-[#c8cdd6]">
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f7f8fa]'}>
                  <td className="px-3 py-2 text-[11px] uppercase tracking-wide text-[#4a5568] font-semibold border-r border-[#e2e5ea] w-36">
                    {r.label}
                  </td>
                  <td className="px-3 py-2 text-[#1a2332] font-medium">{String(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

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
      </div>

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
    </div>
  )
}
