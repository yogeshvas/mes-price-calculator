import { useState, useEffect, useRef } from 'react'
import { searchCountry } from '../api'

export default function CountrySearchSelect({ label, value, valueName, onChange, required, locked }) {
  const [query, setQuery] = useState(valueName || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!value) setQuery('')
  }, [value])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.length < 2) { setResults([]); setOpen(false); return }
    if (query === valueName) return

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchCountry(query)
        const list = Object.entries(data).map(([id, name]) => ({ id, name }))
        setResults(list)
        setOpen(list.length > 0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [query])

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(id, name) {
    setQuery(name)
    setOpen(false)
    setResults([])
    onChange(id, name)
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setOpen(false)
    onChange('', '')
  }

  return (
    <div className="flex flex-col gap-1" ref={wrapperRef}>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-[#4a5568]">
        {label}{required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { if (locked) return; setQuery(e.target.value); if (!e.target.value) onChange('', '') }}
          onFocus={() => !locked && results.length > 0 && setOpen(true)}
          placeholder="Search country..."
          readOnly={locked}
          className={`w-full h-8 px-2 pr-8 text-[13px] border outline-none text-[#1a2332]
            ${locked
              ? 'bg-[#eef0f3] border-[#b0b8c4] cursor-not-allowed text-[#4a5568]'
              : value
                ? 'bg-white border-[#1b3f6b] ring-1 ring-[#1b3f6b]'
                : 'bg-white border-[#b0b8c4] focus:border-[#1b3f6b] focus:ring-1 focus:ring-[#1b3f6b]'
            }`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {locked ? (
            <svg className="w-3.5 h-3.5 text-[#8a95a3]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 17v-6m0 0V9a3 3 0 0 1 6 0v2M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" />
            </svg>
          ) : loading ? (
            <div className="w-3.5 h-3.5 border-2 border-[#1b3f6b] border-t-transparent rounded-full animate-spin" />
          ) : value ? (
            <button onClick={handleClear} className="text-[#8a95a3] hover:text-[#1a2332]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <svg className="w-3.5 h-3.5 text-[#8a95a3]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          )}
        </div>

        {open && results.length > 0 && (
          <ul className="absolute z-50 mt-0 w-full bg-white border border-[#b0b8c4] border-t-0 max-h-48 overflow-y-auto shadow-md">
            {results.map(({ id, name }) => (
              <li
                key={id}
                onMouseDown={() => select(id, name)}
                className={`px-3 py-2 text-[13px] cursor-pointer flex items-center justify-between border-b border-[#eef0f3] last:border-0
                  ${value === id ? 'bg-[#e8edf5] text-[#1b3f6b] font-semibold' : 'text-[#1a2332] hover:bg-[#f4f5f7]'}`}
              >
                {name}
                {value === id && (
                  <svg className="w-3.5 h-3.5 text-[#1b3f6b]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}

        {open && results.length === 0 && !loading && query.length >= 2 && (
          <div className="absolute z-50 mt-0 w-full bg-white border border-[#b0b8c4] border-t-0 px-3 py-2 text-[12px] text-[#8a95a3] shadow-md">
            No results for "{query}"
          </div>
        )}
      </div>
      {value && (
        <p className="text-[11px] text-[#4a7ab5] mt-0.5">ID: {value} — {query}</p>
      )}
    </div>
  )
}
