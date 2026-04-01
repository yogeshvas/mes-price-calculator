import { useEffect, useState, useMemo } from 'react'
import { fetchCountries, fetchFreightCharge } from './api'
import StepIndicator from './components/StepIndicator'
import SelectField from './components/SelectField'
import InputField from './components/InputField'
import ResultCard from './components/ResultCard'
import CountrySearchSelect from './components/CountrySearchSelect'
import './index.css'

const STEPS = ['Service', 'Route', 'Parcel', 'Options', 'Result']
const ZAMBIA_ID = '3'
const ZAMBIA_NAME = 'Zambia'

const DEFAULT_FORM = {
  sourceCountry: '',
  sourceName: '',
  sourceState: '',
  sourceCity: '',
  destinationCountry: '',
  destinationName: '',
  destinationState: '',
  destinationCity: '',
  pieces: 1,
  length: 10,
  width: 10,
  height: 10,
  grossWeight: 1,
  declaredValue: 100,
  insurance: false,
  serviceType: '',
}

function getInitialFormAndStep() {
  const t = new URLSearchParams(window.location.search).get('type')
  if (t === 'domestic') {
    return {
      step: 2,
      form: {
        ...DEFAULT_FORM,
        serviceType: 'domestic',
        sourceCountry: ZAMBIA_ID,
        sourceName: ZAMBIA_NAME,
        destinationCountry: ZAMBIA_ID,
        destinationName: ZAMBIA_NAME,
      },
    }
  }
  if (t === 'international') {
    return { step: 2, form: { ...DEFAULT_FORM, serviceType: 'international' } }
  }
  return { step: 1, form: DEFAULT_FORM }
}

export default function App() {
  const [{ step: initStep, form: initForm }] = useState(getInitialFormAndStep)
  const [step, setStep] = useState(initStep)
  const [form, setForm] = useState(initForm)
  const [countriesData, setCountriesData] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingCountries, setFetchingCountries] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCountries()
      .then((data) => setCountriesData(data))
      .catch(() => setError('Failed to load reference data.'))
      .finally(() => setFetchingCountries(false))
  }, [])

  // Sync ?type= URL param when service type is chosen
  useEffect(() => {
    if (!form.serviceType) return
    const url = new URL(window.location.href)
    url.searchParams.set('type', form.serviceType)
    window.history.replaceState({}, '', url)
  }, [form.serviceType])

  function getCountryObj(id) {
    return countriesData.find((c) => String(c.id) === String(id))
  }

  function getStates(countryId) {
    const c = getCountryObj(countryId)
    if (!c?.state?.length) return []
    return c.state.map((s) => ({ value: String(s.id), label: s.state_name }))
  }

  function getCities(countryId, stateId) {
    const c = getCountryObj(countryId)
    if (!c?.state?.length) return []
    const states = stateId
      ? c.state.filter((s) => String(s.id) === String(stateId))
      : c.state
    return states.flatMap((s) => (s.city || []).map((ci) => ({ value: String(ci.id), label: ci.city_name })))
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function selectService(type) {
    if (type === 'domestic') {
      setForm({
        ...DEFAULT_FORM,
        serviceType: 'domestic',
        sourceCountry: ZAMBIA_ID,
        sourceName: ZAMBIA_NAME,
        destinationCountry: ZAMBIA_ID,
        destinationName: ZAMBIA_NAME,
      })
    } else {
      setForm({ ...DEFAULT_FORM, serviceType: 'international' })
    }
    setStep(2)
  }

  const isDomestic = form.serviceType === 'domestic'

  const sourceStates = useMemo(() => getStates(form.sourceCountry), [form.sourceCountry, countriesData])
  const sourceCities = useMemo(() => getCities(form.sourceCountry, form.sourceState), [form.sourceCountry, form.sourceState, countriesData])
  const destStates = useMemo(() => getStates(form.destinationCountry), [form.destinationCountry, countriesData])
  const destCities = useMemo(() => getCities(form.destinationCountry, form.destinationState), [form.destinationCountry, form.destinationState, countriesData])

  const step2Valid =
    form.sourceCountry && form.destinationCountry &&
    (sourceCities.length === 0 || form.sourceCity) &&
    (destCities.length === 0 || form.destinationCity)

  const step3Valid =
    Number(form.pieces) > 0 && Number(form.length) > 0 &&
    Number(form.width) > 0 && Number(form.height) > 0 &&
    Number(form.grossWeight) > 0 && Number(form.declaredValue) > 0

  async function handleGetQuote() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const sourceCity = sourceCities.length > 0 ? form.sourceCity : form.sourceCountry
      const destinationCity = destCities.length > 0 ? form.destinationCity : form.destinationCountry
      const data = await fetchFreightCharge({
        sourceCountry: form.sourceCountry, sourceCity,
        destinationCountry: form.destinationCountry, destinationCity,
        insurance: form.insurance,
        pieces: form.pieces, length: form.length, width: form.width,
        height: form.height, grossWeight: form.grossWeight, declaredValue: form.declaredValue,
      })
      setResult(data)
      setStep(5)
    } catch (e) {
      setError(e.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setForm(DEFAULT_FORM)
    setResult(null)
    setError(null)
    setStep(1)
    const url = new URL(window.location.href)
    url.searchParams.delete('type')
    window.history.replaceState({}, '', url)
  }

  // Volumetric weight: inches → L×W×H / 305 = kg
  const volWeight = (form.length * form.width * form.height) / 305
  const chargeableWeight = Math.max(Number(form.grossWeight), volWeight)
  // Total volume in m³ from inches (1 in³ = 0.000016387 m³)
  const totalVolume = form.length * form.width * form.height * 0.000016387

  return (
    <div className="min-h-screen bg-[#eef0f3] flex flex-col">
      {/* Top nav bar */}
      <div className="bg-[#1b3f6b] h-10 flex items-center px-4 sm:px-6 gap-2 sm:gap-4 shrink-0 overflow-x-auto">
        <span className="text-white font-bold text-[13px] tracking-wide uppercase whitespace-nowrap">Mercury MES</span>
        <span className="text-[#7aaee0] text-[12px]">/</span>
        <span className="text-[#7aaee0] text-[12px] hidden sm:inline whitespace-nowrap">Freight Management</span>
        <span className="text-[#7aaee0] text-[12px] hidden sm:inline">/</span>
        <span className="text-white text-[12px] whitespace-nowrap">Price Calculator</span>
      </div>

      {/* Page header */}
      <div className="bg-white border-b border-[#c8cdd6] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[15px] sm:text-[16px] font-bold text-[#1a2332] tracking-tight">Freight Price Calculator</h1>
          <p className="text-[11px] sm:text-[12px] text-[#6b7889] mt-0.5 hidden sm:block">Calculate estimated freight charges between origin and destination</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-1 border whitespace-nowrap
            ${fetchingCountries ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-green-400 bg-green-50 text-green-700'}`}>
            {fetchingCountries ? 'Loading...' : 'System Ready'}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-3 sm:p-6">
        <div className="max-w-3xl mx-auto">
          {fetchingCountries ? (
            <div className="bg-white border border-[#c8cdd6] p-12 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#1b3f6b] border-t-transparent rounded-full animate-spin" />
              <p className="text-[13px] text-[#6b7889]">Loading reference data, please wait...</p>
            </div>
          ) : error && !result ? (
            <div className="bg-white border border-red-300 p-8 flex flex-col items-center gap-3">
              <p className="text-[13px] text-red-600 font-semibold">{error}</p>
              <button onClick={() => window.location.reload()}
                className="px-4 h-8 bg-[#1b3f6b] text-white text-[12px] font-semibold uppercase tracking-wide hover:bg-[#15305a]">
                Reload
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#c8cdd6]">
              <StepIndicator steps={STEPS} current={step} />

              <div className="px-3 sm:px-6 pb-4 sm:pb-6">

                {/* STEP 1: Service Type */}
                {step === 1 && (
                  <div className="flex flex-col gap-4 sm:gap-6">
                    <p className="text-[13px] text-[#4a5568] text-center mt-1">What type of shipment are you sending?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => selectService('domestic')}
                        className="border-2 border-[#c8cdd6] hover:border-[#1b3f6b] hover:bg-[#f0f4fa] p-6 sm:p-8 flex flex-col items-center gap-3 transition-colors group"
                      >
                        <div className="w-12 h-12 bg-[#e8edf5] group-hover:bg-[#d0ddf0] flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#1b3f6b]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-[#1a2332] uppercase tracking-wide">Domestic</p>
                          <p className="text-[12px] text-[#6b7889] mt-1">Within Zambia</p>
                        </div>
                      </button>

                      <button
                        onClick={() => selectService('international')}
                        className="border-2 border-[#c8cdd6] hover:border-[#1b3f6b] hover:bg-[#f0f4fa] p-6 sm:p-8 flex flex-col items-center gap-3 transition-colors group"
                      >
                        <div className="w-12 h-12 bg-[#e8edf5] group-hover:bg-[#d0ddf0] flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#1b3f6b]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-[#1a2332] uppercase tracking-wide">International</p>
                          <p className="text-[12px] text-[#6b7889] mt-1">Worldwide delivery</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Route */}
                {step === 2 && (
                  <div className="flex flex-col gap-4 sm:gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Origin */}
                      <fieldset className="border border-[#c8cdd6] p-3 sm:p-4">
                        <legend className="px-2 text-[11px] font-bold uppercase tracking-wider text-[#1b3f6b]">
                          Origin
                        </legend>
                        <div className="flex flex-col gap-3">
                          <CountrySearchSelect
                            label="Country"
                            value={form.sourceCountry}
                            valueName={form.sourceName}
                            onChange={(id, name) => { set('sourceCountry', id); set('sourceName', name); set('sourceState', ''); set('sourceCity', '') }}
                            required
                            locked={isDomestic}
                          />
                          {sourceStates.length > 0 && (
                            <SelectField
                              label="Province"
                              value={form.sourceState}
                              onChange={(v) => { set('sourceState', v); set('sourceCity', '') }}
                              options={sourceStates}
                              placeholder="-- Select Province --"
                            />
                          )}
                          {sourceCities.length > 0 && (
                            <SelectField
                              label="City"
                              value={form.sourceCity}
                              onChange={(v) => set('sourceCity', v)}
                              options={sourceCities}
                              placeholder="-- Select City --"
                              required
                            />
                          )}
                          {!isDomestic && form.sourceCountry && sourceCities.length === 0 && (
                            <Notice text="City selection not required for this origin." />
                          )}
                        </div>
                      </fieldset>

                      {/* Destination */}
                      <fieldset className="border border-[#c8cdd6] p-3 sm:p-4">
                        <legend className="px-2 text-[11px] font-bold uppercase tracking-wider text-[#1b3f6b]">
                          Destination
                        </legend>
                        <div className="flex flex-col gap-3">
                          <CountrySearchSelect
                            label="Country"
                            value={form.destinationCountry}
                            valueName={form.destinationName}
                            onChange={(id, name) => { set('destinationCountry', id); set('destinationName', name); set('destinationState', ''); set('destinationCity', '') }}
                            required
                            locked={isDomestic}
                          />
                          {destStates.length > 0 && (
                            <SelectField
                              label="Province"
                              value={form.destinationState}
                              onChange={(v) => { set('destinationState', v); set('destinationCity', '') }}
                              options={destStates}
                              placeholder="-- Select Province --"
                            />
                          )}
                          {destCities.length > 0 && (
                            <SelectField
                              label="City"
                              value={form.destinationCity}
                              onChange={(v) => set('destinationCity', v)}
                              options={destCities}
                              placeholder="-- Select City --"
                              required
                            />
                          )}
                          {!isDomestic && form.destinationCountry && destCities.length === 0 && (
                            <Notice text="City selection not required for this destination." />
                          )}
                        </div>
                      </fieldset>
                    </div>

                    {/* Route preview */}
                    {form.sourceCountry && form.destinationCountry && (
                      <div className="bg-[#f4f5f7] border border-[#dde1e7] px-3 sm:px-4 py-2 flex flex-wrap items-center gap-2 sm:gap-3 text-[12px]">
                        <span className="text-[#4a5568] uppercase tracking-wide font-semibold text-[11px]">Route</span>
                        <span className="text-[#1a2332] font-medium">{form.sourceName || '—'}</span>
                        <span className="text-[#8a95a3]">→</span>
                        <span className="text-[#1a2332] font-medium">{form.destinationName || '—'}</span>
                        <span className={`sm:ml-auto px-2 py-0.5 text-[11px] font-semibold uppercase border
                          ${isDomestic ? 'border-[#1b3f6b] text-[#1b3f6b] bg-[#e8edf5]' : 'border-[#4a7ab5] text-[#4a7ab5] bg-[#edf3fb]'}`}>
                          {isDomestic ? 'Domestic' : 'International'}
                        </span>
                      </div>
                    )}

                    <FormActions onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!step2Valid} />
                  </div>
                )}

                {/* STEP 3: Parcel */}
                {step === 3 && (
                  <div className="flex flex-col gap-4 sm:gap-5">
                    <fieldset className="border border-[#c8cdd6] p-3 sm:p-4">
                      <legend className="px-2 text-[11px] font-bold uppercase tracking-wider text-[#1b3f6b]">
                        Package Dimensions
                      </legend>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-1">
                        <InputField label="Pieces" value={form.pieces} onChange={(v) => set('pieces', v)} min={1} step={1} required />
                        <InputField label="Length" value={form.length} onChange={(v) => set('length', v)} unit="in" min={0.01} step={0.01} required />
                        <InputField label="Width" value={form.width} onChange={(v) => set('width', v)} unit="in" min={0.01} step={0.01} required />
                        <InputField label="Height" value={form.height} onChange={(v) => set('height', v)} unit="in" min={0.01} step={0.01} required />
                      </div>
                    </fieldset>

                    <fieldset className="border border-[#c8cdd6] p-3 sm:p-4">
                      <legend className="px-2 text-[11px] font-bold uppercase tracking-wider text-[#1b3f6b]">
                        Weight & Value
                      </legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-1">
                        <InputField label="Gross Weight" value={form.grossWeight} onChange={(v) => set('grossWeight', v)} unit="kg" min={0.01} step={0.01} required />
                        <InputField label="Declared Value" value={form.declaredValue} onChange={(v) => set('declaredValue', v)} unit="ZMW" min={0.01} step={0.01} required />
                      </div>
                    </fieldset>

                    {/* Computed fields — read only */}
                    <div className="bg-[#f4f5f7] border border-[#dde1e7]">
                      <div className="px-4 py-1.5 border-b border-[#dde1e7] bg-[#eef0f3]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#4a5568]">Computed Values</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#dde1e7]">
                        <ComputedField label="Volumetric Weight" value={`${volWeight.toFixed(2)} kg`} />
                        <ComputedField label="Chargeable Weight" value={`${chargeableWeight.toFixed(2)} kg`} />
                        <ComputedField label="Total Volume" value={`${totalVolume.toFixed(4)} m³`} />
                      </div>
                    </div>

                    <FormActions onBack={() => setStep(2)} onNext={() => setStep(4)} nextDisabled={!step3Valid} />
                  </div>
                )}

                {/* STEP 4: Options */}
                {step === 4 && (
                  <div className="flex flex-col gap-4 sm:gap-5">
                    <fieldset className="border border-[#c8cdd6] p-3 sm:p-4">
                      <legend className="px-2 text-[11px] font-bold uppercase tracking-wider text-[#1b3f6b]">
                        Service Configuration
                      </legend>
                      <div className="mt-2">
                        <label className="text-[11px] font-semibold uppercase tracking-wide text-[#4a5568] block mb-2">
                          Insurance
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer w-fit">
                          <input
                            type="checkbox"
                            checked={form.insurance}
                            onChange={(e) => set('insurance', e.target.checked)}
                            className="w-4 h-4 border border-[#b0b8c4] accent-[#1b3f6b]"
                          />
                          <span className="text-[13px] text-[#1a2332]">
                            Apply cargo insurance (2% of declared value
                            {form.insurance && ` = ZMW ${(Number(form.declaredValue) * 0.02).toFixed(2)}`})
                          </span>
                        </label>
                        <p className="text-[11px] text-[#6b7889] mt-1.5">
                          Declared value for this shipment: <span className="font-semibold text-[#1a2332]">ZMW {Number(form.declaredValue).toLocaleString()}</span>
                        </p>
                      </div>
                    </fieldset>

                    {/* Pre-submit summary */}
                    <div className="border border-[#c8cdd6]">
                      <div className="bg-[#eef0f3] border-b border-[#c8cdd6] px-4 py-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#4a5568]">Quotation Summary</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[12px] min-w-[280px]">
                          <tbody>
                            {[
                              ['Origin', form.sourceName || '—'],
                              ['Destination', form.destinationName || '—'],
                              ['Service', isDomestic ? 'Domestic' : 'International'],
                              ['Dimensions', `${form.length} × ${form.width} × ${form.height} in`],
                              ['Gross Weight', `${form.grossWeight} kg`],
                              ['Pieces', form.pieces],
                              ['Declared Value', `ZMW ${Number(form.declaredValue).toLocaleString()}`],
                              ['Insurance', form.insurance ? `ZMW ${(Number(form.declaredValue) * 0.02).toFixed(2)}` : 'None'],
                            ].map(([k, v], i) => (
                              <tr key={k} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f7f8fa]'}>
                                <td className="px-3 sm:px-4 py-2 text-[#4a5568] font-semibold border-r border-[#e2e5ea] w-32 sm:w-40 text-[11px] sm:text-[12px]">{k}</td>
                                <td className="px-3 sm:px-4 py-2 text-[#1a2332] font-medium text-[11px] sm:text-[12px]">{String(v)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {error && (
                      <div className="border border-red-300 bg-red-50 px-4 py-2 text-[12px] text-red-700 font-medium">
                        Error: {error}
                      </div>
                    )}

                    <FormActions
                      onBack={() => setStep(3)}
                      onNext={handleGetQuote}
                      nextLabel={loading ? 'Processing...' : 'Calculate Freight'}
                      nextDisabled={loading}
                      nextLoading={loading}
                    />
                  </div>
                )}

                {/* STEP 5: Result */}
                {step === 5 && result && (
                  <ResultCard result={result} formData={form} onReset={handleReset} />
                )}

              </div>
            </div>
          )}

          <div className="mt-3 text-[11px] text-[#8a95a3] text-center sm:text-right">
            Mercury MES API v3 &nbsp;&bull;&nbsp; Rates are estimates only
          </div>
        </div>
      </div>
    </div>
  )
}

function Notice({ text, className = '' }) {
  return (
    <div className={`border-l-2 border-[#4a7ab5] bg-[#edf3fb] px-3 py-2 text-[12px] text-[#1b3f6b] ${className}`}>
      {text}
    </div>
  )
}

function ComputedField({ label, value }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-[#4a5568] font-semibold mb-1">{label}</p>
      <p className="text-[14px] font-bold text-[#1a2332]">{value}</p>
    </div>
  )
}

function FormActions({ onBack, onNext, nextLabel = 'Next', nextDisabled, nextLoading }) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-[#dde1e7] mt-2">
      {onBack && (
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-5 h-9 border border-[#b0b8c4] text-[#1a2332] text-[12px] font-semibold uppercase tracking-wide hover:bg-[#eef0f3]"
        >
          Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className={`w-full sm:w-auto px-6 h-9 text-[12px] font-semibold uppercase tracking-wide flex items-center justify-center gap-2
          ${nextDisabled
            ? 'bg-[#c8cdd6] text-[#8a95a3] cursor-not-allowed'
            : 'bg-[#1b3f6b] text-white hover:bg-[#15305a]'}`}
      >
        {nextLoading && (
          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {nextLabel}
      </button>
    </div>
  )
}
