import { MES_EMAIL as EMAIL, MES_PRIVATE_KEY as PRIVATE_KEY } from './constants'

const TIMEOUT_MS = 15000

// Allowed characters for country search — letters, spaces, hyphens only
const SAFE_QUERY_RE = /^[a-zA-Z\s\-']+$/

// Numeric bounds for shipment fields
const BOUNDS = {
  pieces:       { min: 1,    max: 999  },
  length:       { min: 0.01, max: 500  },
  width:        { min: 0.01, max: 500  },
  height:       { min: 0.01, max: 500  },
  grossWeight:  { min: 0.01, max: 9999 },
  declaredValue:{ min: 0.01, max: 9999999 },
}

function clamp(value, min, max) {
  const n = Number(value)
  if (!isFinite(n)) throw new Error(`Invalid numeric value: ${value}`)
  if (n < min || n > max) throw new Error(`Value ${n} is out of allowed range (${min}–${max})`)
  return parseFloat(n.toFixed(2))
}

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  return fetch(url, { ...options, signal: controller.signal })
    .catch((err) => {
      if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.')
      throw err
    })
    .finally(() => clearTimeout(timer))
}

export async function searchCountry(query) {
  if (!query || query.trim().length < 2) return {}
  const trimmed = query.trim().slice(0, 50) // cap length
  if (!SAFE_QUERY_RE.test(trimmed)) return {}  // reject anything other than letters/spaces
  const res = await fetchWithTimeout(`/mes1sep/app/getcountry?country_name=${encodeURIComponent(trimmed)}`)
  if (!res.ok) throw new Error('Country search failed')
  return res.json()
}

export async function fetchCountries() {
  const res = await fetchWithTimeout('/api/getcountrystatecity')
  if (!res.ok) throw new Error('Failed to fetch countries')
  const json = await res.json()
  return json?.data?.country ?? []
}

export async function fetchFreightCharge({
  sourceCountry,
  sourceCity,
  destinationCountry,
  destinationCity,
  insurance,
  pieces,
  length,
  width,
  height,
  grossWeight,
  declaredValue,
}) {
  // Validate IDs are numeric strings
  if (!sourceCountry || !destinationCountry) throw new Error('Source and destination country are required')
  if (!/^\d+$/.test(String(sourceCountry)) || !/^\d+$/.test(String(destinationCountry))) {
    throw new Error('Invalid country ID')
  }
  if (sourceCountry === destinationCountry && String(sourceCity) === String(destinationCity)) {
    throw new Error('Origin and destination cannot be the same location')
  }

  // Clamp and validate all numeric fields
  const sanitized = {
    pieces:        clamp(pieces,        BOUNDS.pieces.min,        BOUNDS.pieces.max),
    length:        clamp(length,        BOUNDS.length.min,        BOUNDS.length.max),
    width:         clamp(width,         BOUNDS.width.min,         BOUNDS.width.max),
    height:        clamp(height,        BOUNDS.height.min,        BOUNDS.height.max),
    grossWeight:   clamp(grossWeight,   BOUNDS.grossWeight.min,   BOUNDS.grossWeight.max),
    declaredValue: clamp(declaredValue, BOUNDS.declaredValue.min, BOUNDS.declaredValue.max),
  }

  const shipment = JSON.stringify([{
    id: '1',
    vendor_id: '1',
    source_country:      String(sourceCountry),
    source_city:         String(sourceCity),
    destination_country: String(destinationCountry),
    destination_city:    String(destinationCity),
    insurance:           insurance ? 1 : 0,
    pieces:              sanitized.pieces,
    length:              sanitized.length,
    width:               sanitized.width,
    height:              sanitized.height,
    gross_weight:        sanitized.grossWeight,
    declared_value:      sanitized.declaredValue,
  }])

  const params = new URLSearchParams({
    email:                EMAIL,
    private_key:          PRIVATE_KEY,
    domestic_service:     1,
    international_service: 4,
    shipment,
  })

  const res = await fetchWithTimeout(`/api/getfreight?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch freight charge')
  return res.json()
}
