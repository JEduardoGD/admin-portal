const INT32_MIN = -2147483648
const INT32_MAX = 2147483647

export function getLookupParameters(search) {
  const params = new URLSearchParams(search)
  const parseInteger = (value) => {
    if (value === null || !/^-?\d+$/.test(value)) return null
    const number = Number(value)
    return Number.isInteger(number) && number >= INT32_MIN && number <= INT32_MAX
      ? number
      : null
  }

  const id = parseInteger(params.get('id'))
  const rnd = parseInteger(params.get('rnd'))
  return id === null || rnd === null ? null : { id, rnd }
}

export function getValidity(start, end, today = new Date()) {
  if (!isISODate(start) || !isISODate(end) || start > end) return 'unknown'

  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  if (localDate < start) return 'upcoming'
  if (localDate > end) return 'expired'
  return 'current'
}

export function isISODate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function getAffiliationKind(value) {
  const type = (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (type.includes('swl') || type.includes('short wave') || type.includes('shortwave') || type.includes('radioescucha')) return 'swl'
  if (type.includes('radioaficionad') || type.includes('radio amateur')) return 'amateur'
  return null
}

export function getPhotoSource(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  const image = value.trim()
  if (/^data:image\/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(image)) {
    return image.replace(/\s/g, '')
  }
  if (/^[A-Za-z0-9+/=\s]+$/.test(image)) return `data:image/jpeg;base64,${image.replace(/\s/g, '')}`
  return null
}
