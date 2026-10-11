import test from 'node:test'
import assert from 'node:assert/strict'
import { getAffiliationKind, getLookupParameters, getPhotoSource, getValidity } from './affiliation.js'

test('lookup parameters are whole int32 values and never inferred from missing values', () => {
  assert.deepEqual(getLookupParameters('?id=1073741824&rnd=1073741824'), { id: 1073741824, rnd: 1073741824 })
  assert.equal(getLookupParameters('?id=1'), null)
  assert.equal(getLookupParameters('?id=1.5&rnd=2'), null)
  assert.equal(getLookupParameters('?id=2147483648&rnd=2'), null)
  assert.equal(getLookupParameters('?id=&rnd=2'), null)
})

test('membership validity includes both boundary dates and distinguishes upcoming and expired', () => {
  const today = new Date(2026, 9, 11, 23, 30)
  assert.equal(getValidity('2026-10-11', '2026-10-11', today), 'current')
  assert.equal(getValidity('2026-10-12', '2027-10-11', today), 'upcoming')
  assert.equal(getValidity('2025-10-11', '2026-10-10', today), 'expired')
  assert.equal(getValidity(null, '2027-10-11', today), 'unknown')
  assert.equal(getValidity('2026-02-30', '2027-10-11', today), 'unknown')
  assert.equal(getValidity('2027-01-01', '2026-01-01', today), 'unknown')
})

test('both backend membership type names select the relevant public definition', () => {
  assert.equal(getAffiliationKind('Radioaficionado'), 'amateur')
  assert.equal(getAffiliationKind('Short wave listener'), 'swl')
  assert.equal(getAffiliationKind('Radioescucha SWL'), 'swl')
})

test('base64 thumbnails accept image data and reject arbitrary URLs', () => {
  assert.equal(getPhotoSource('aGVsbG8='), 'data:image/jpeg;base64,aGVsbG8=')
  assert.equal(getPhotoSource('data:image/png;base64,aGVsbG8='), 'data:image/png;base64,aGVsbG8=')
  assert.equal(getPhotoSource('https://example.com/photo.jpg'), null)
})
