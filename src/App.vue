<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowUpRight, CircleAlert, CircleCheck, Clock3, Globe2, Link2Off, RefreshCw, SearchX, UserRound } from '@lucide/vue'
import { getAffiliationKind, getLookupParameters, getPhotoSource, getValidity, isISODate } from './affiliation.js'
import { translations } from './translations.js'

const language = ref('es')
const state = ref('loading')
const member = ref(null)
let requestController = null

const t = computed(() => translations[language.value])
const kind = computed(() => getAffiliationKind(member.value?.tipoAfiliacion))
const validity = computed(() => getValidity(member.value?.inicioVigencia, member.value?.finVigencia))
const photo = computed(() => getPhotoSource(member.value?.thumbnailImagenPersonal))
const typeLabel = computed(() => {
  if (kind.value === 'amateur') return t.value.amateurType
  if (kind.value === 'swl') return t.value.swlType
  return member.value?.tipoAfiliacion || ''
})
const definition = computed(() => kind.value ? t.value[`${kind.value}Definition`] : '')
const recordStateLabel = computed(() => {
  const raw = member.value?.estadoNombre
  if (!raw) return '—'
  if (language.value === 'es') return raw
  const knownStates = {
    activo: 'Active', inactivo: 'Inactive', vigente: 'Current', vencido: 'Expired',
    pendiente: 'Pending', cancelado: 'Cancelled', suspendido: 'Suspended',
    aprobado: 'Approved', rechazado: 'Rejected',
  }
  const key = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return knownStates[key] || raw
})

function setLanguage(next) {
  language.value = next
  try { localStorage.setItem('fmre-language', next) } catch { /* Storage may be disabled. */ }
}

watch(language, (next) => {
  document.documentElement.lang = next
  document.title = `${translations[next].title} · FMRE`
})

function formatDate(value) {
  if (!isISODate(value)) return '—'
  return new Intl.DateTimeFormat(language.value === 'es' ? 'es-MX' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`))
}

async function lookup() {
  requestController?.abort()
  const params = getLookupParameters(window.location.search)
  member.value = null
  if (!params) {
    state.value = 'missing'
    return
  }

  const controller = new AbortController()
  requestController = controller
  state.value = 'loading'
  try {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/api/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
      cache: 'no-store',
    })
    if (response.status === 404 || response.status === 204) {
      state.value = 'notFound'
      return
    }
    if (!response.ok) throw new Error(`Lookup failed: ${response.status}`)

    const body = await response.text()
    if (!body.trim()) {
      state.value = 'notFound'
      return
    }
    const result = JSON.parse(body)
    if (!result || typeof result.nombre !== 'string' || !result.nombre.trim()) {
      state.value = 'notFound'
      return
    }
    member.value = result
    state.value = 'success'
  } catch (error) {
    if (error.name !== 'AbortError') state.value = 'error'
  } finally {
    if (requestController === controller) requestController = null
  }
}

onMounted(() => {
  try {
    if (localStorage.getItem('fmre-language') === 'en') language.value = 'en'
  } catch { /* Default to Spanish. */ }
  window.addEventListener('popstate', lookup)
  lookup()
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', lookup)
  requestController?.abort()
})
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="https://fmre.mx/" target="_blank" rel="noopener noreferrer" :aria-label="t.officialSite">
          <img
            class="brand-logo"
            src="https://i0.wp.com/fmre.mx/wp-content/uploads/2024/12/qtq_95.webp?fit=103%2C201&amp;ssl=1"
            alt="FMRE"
            width="38"
            height="58"
          />
          <span class="brand-name"><strong>FMRE</strong><span>{{ t.federation }}</span></span>
        </a>
        <div class="language-switch" role="group" :aria-label="t.languageLabel">
          <Globe2 :size="17" aria-hidden="true" />
          <button type="button" :aria-pressed="language === 'es'" :class="{ selected: language === 'es' }" @click="setLanguage('es')">ES</button>
          <button type="button" :aria-pressed="language === 'en'" :class="{ selected: language === 'en' }" @click="setLanguage('en')">EN</button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="page-intro">
        <p class="eyebrow"><span class="eyebrow-rule"></span>{{ t.publicRecord }}</p>
        <h1>{{ t.title }}</h1>
      </div>

      <section class="result-panel" aria-live="polite" :aria-busy="state === 'loading'">
        <template v-if="state === 'success'">
          <div class="panel-topline">
            <span class="record-label">{{ t.record }}</span>
            <span class="status" :class="`status-${validity}`">
              <CircleCheck v-if="validity === 'current'" :size="18" aria-hidden="true" />
              <Clock3 v-else-if="validity === 'upcoming'" :size="18" aria-hidden="true" />
              <CircleAlert v-else :size="18" aria-hidden="true" />
              {{ t[validity] }}
            </span>
          </div>

          <div class="profile">
            <div class="portrait" :class="{ 'portrait-empty': !photo }">
              <img v-if="photo" :src="photo" :alt="t.imageAlt.replace('{name}', member.nombre)" @error="member.thumbnailImagenPersonal = null" />
              <UserRound v-else :size="48" :stroke-width="1.2" aria-hidden="true" />
            </div>
            <div class="profile-details">
              <div class="field-label">{{ t.person }}</div>
              <h2>{{ member.nombre }}</h2>
              <div class="identity-line">
                <div class="callsign-block">
                  <span class="field-label">{{ t.callsign }}</span>
                  <strong class="callsign">{{ member.indicativo || t.noCallsign }}</strong>
                </div>
                <span class="identity-divider" aria-hidden="true"></span>
                <div class="membership-block">
                  <span class="field-label">{{ t.membershipType }}</span>
                  <strong>{{ typeLabel || '—' }}</strong>
                </div>
              </div>
            </div>
          </div>

          <dl class="record-details">
            <div><dt>{{ t.starts }}</dt><dd>{{ formatDate(member.inicioVigencia) }}</dd></div>
            <div><dt>{{ t.ends }}</dt><dd>{{ formatDate(member.finVigencia) }}</dd></div>
            <div><dt>{{ t.recordState }}</dt><dd>{{ recordStateLabel }}</dd></div>
          </dl>
        </template>

        <div v-else-if="state === 'loading'" class="loading-state" role="status">
          <div class="loading-symbol"><RefreshCw :size="26" aria-hidden="true" /></div>
          <p>{{ t.loading }}</p>
        </div>

        <div v-else class="empty-state" role="status">
          <div class="empty-icon">
            <Link2Off v-if="state === 'missing'" :size="29" :stroke-width="1.6" aria-hidden="true" />
            <SearchX v-else-if="state === 'notFound'" :size="29" :stroke-width="1.6" aria-hidden="true" />
            <CircleAlert v-else :size="29" :stroke-width="1.6" aria-hidden="true" />
          </div>
          <h2>{{ t[`${state}Title`] }}</h2>
          <p>{{ t[`${state}Detail`] }}</p>
          <button v-if="state === 'error' || state === 'notFound'" class="retry-button" type="button" @click="lookup">
            <RefreshCw :size="16" aria-hidden="true" />{{ t.retry }}
          </button>
        </div>
      </section>

      <section v-if="state === 'success' && definition" class="definition-section">
        <div>
          <p class="field-label">{{ t.membershipType }}</p>
          <h2>{{ t.about }}</h2>
        </div>
        <div class="definition-copy">
          <h3>{{ typeLabel }}</h3>
          <p>{{ definition }}</p>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <span>© {{ new Date().getFullYear() }} FMRE A.C. <span class="footer-separator">·</span> {{ t.memberIaru }}</span>
        <a href="https://fmre.mx/" target="_blank" rel="noopener noreferrer">{{ t.officialSite }} <ArrowUpRight :size="15" aria-hidden="true" /></a>
      </div>
    </footer>
  </div>
</template>
