// Prova E2E del frontend amb Chrome headless + CDP (sense dependències externes).
//
// Requisits previs:
//   - Backend en marxa a http://localhost:8080 (docker compose up -d)
//   - Frontend en marxa a http://localhost:5173 (npm run dev)
//   - Google Chrome instal·lat (o defineix CHROME_PATH)
//
// Ús: npm run e2e
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9223)
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const EMAIL = process.env.ADMIN_EMAIL ?? 'admin@gestiofe.local'
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin1234'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const userDataDir = mkdtempSync(join(tmpdir(), 'gestio-fe-chrome-'))
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${userDataDir}`,
  'about:blank',
], { stdio: 'ignore' })

let ws, nextId = 1
const pending = new Map()

function send(method, params = {}) {
  const id = nextId++
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.text)
  return res.result?.value
}

async function waitFor(fn, { timeout = 15000, interval = 250, label = '' } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await fn()) return true
    await sleep(interval)
  }
  throw new Error(`Timeout esperant: ${label}`)
}

let failures = 0
let consoleErrors = []
let netErrors = []
let netRequests = []
const check = (desc, ok, extra = '') => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} - ${desc}${ok ? '' : ` ${extra}`}`)
  if (!ok) failures++
}

try {
  // Espera el port de depuració
  await waitFor(async () => {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      return r.ok
    } catch {
      return false
    }
  }, { label: 'Chrome CDP' })

  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
  ws = new WebSocket(target.webSocketDebuggerUrl)
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    }
  })
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve)
    ws.addEventListener('error', reject)
  })

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data)
    if (msg.method === 'Network.requestWillBeSent') {
      netRequests.push(msg.params.request.url)
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '))
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails.text + ' ' +
        (msg.params.exceptionDetails.exception?.description ?? ''))
    }
    if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400) {
      netErrors.push(`${msg.params.response.status} ${msg.params.response.url}`)
    }
    if (msg.method === 'Network.loadingFailed') {
      netErrors.push(`FAILED ${msg.params.errorText} ${msg.params.type}`)
    }
  })
  await send('Runtime.enable')
  await send('Network.enable')
  await send('Page.enable')

  // 1. Carrega /login
  await send('Page.navigate', { url: `${APP}/login` })
  await waitFor(async () => (await evaluate('document.readyState')) === 'complete', { label: 'load /login' })
  await waitFor(async () => await evaluate('!!document.querySelector("input#email")'), { label: 'form login' })
  check('La pàgina de login carrega el formulari', true)

  // 2. Introdueix credencials i envia
  await evaluate(`
    (() => {
      const set = (sel, val) => {
        const el = document.querySelector(sel)
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(el, val)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
      set('input#email', '${EMAIL}')
      set('input#password', '${PASSWORD}')
      document.querySelector('form button[type=submit]').click()
      return true
    })()
  `)

  // 3. Espera la redirecció al panell
  await waitFor(async () => (await evaluate('location.pathname')) === '/', { label: 'redirecció a /', timeout: 20000 })
  check('El login redirigeix al panell', true)

  await waitFor(async () => ((await evaluate('document.body.innerText')) || '').includes('Hola,'), { label: 'panell' })
  const body = await evaluate('document.body.innerText')
  check('El panell mostra la benvinguda', body.includes('Hola,'))
  check('El panell mostra el rol admin', body.includes('admin'))

  // 4. Navega a Usuaris i comprova la taula
  await send('Page.navigate', { url: `${APP}/usuaris` })
  await waitFor(async () => ((await evaluate('document.body.innerText')) || '').includes('Gestió dels comptes'), { label: 'vista usuaris' })
  const usersBody = await evaluate('document.body.innerText')
  check('La vista d\'usuaris carrega', usersBody.includes('Usuaris'))
  check('La taula mostra l\'administrador', usersBody.includes('admin@gestiofe.local'))

  // 4b. Ordenació server-side: clicar la capçalera de correu envia ?sort=email
  netRequests = []
  await evaluate(`
    (() => {
      const th = [...document.querySelectorAll('th.p-datatable-sortable-column')]
        .find((h) => h.innerText.includes('Correu'))
      th.click()
      return true
    })()
  `)
  await waitFor(
    async () => netRequests.some((u) => u.includes('sort=email')),
    { label: 'petició amb sort=email', timeout: 10000 },
  )
  check("L'ordenació de columna demana ?sort=email al servidor", true)

  // 5. Crea un usuari des del diàleg i després elimina'l
  const uniq = Date.now()
  const newEmail = `e2e_${uniq}@gestiofe.local`
  await evaluate(
    `[...document.querySelectorAll('button')].find(b => b.innerText.includes('Nou usuari')).click()`,
  )
  await waitFor(async () => await evaluate('!!document.querySelector("input#user-name")'), {
    label: 'diàleg nou usuari',
  })
  await evaluate(`
    (() => {
      const set = (sel, val) => {
        const el = document.querySelector(sel)
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        s.call(el, val)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
      set('input#user-name', 'Usuari E2E')
      set('input#user-email', '${newEmail}')
      set('input#user-password', 'secret1234')
      return true
    })()
  `)
  await evaluate(
    `[...document.querySelectorAll('.p-dialog button')].find(b => b.innerText.includes('Crea')).click()`,
  )
  await waitFor(async () => ((await evaluate('document.body.innerText')) || '').includes(newEmail), {
    label: 'usuari creat a la taula',
  })
  check('Crea un usuari des de la interfície', true)

  await evaluate(`
    (() => {
      const row = [...document.querySelectorAll('tr')].find((tr) => tr.innerText.includes('${newEmail}'))
      const btn = [...row.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') || '').includes('Elimina'))
      btn.click()
      return true
    })()
  `)
  await waitFor(
    async () =>
      await evaluate(
        `!![...document.querySelectorAll('.p-confirmdialog button')].find(b => b.innerText.trim() === 'Elimina')`,
      ),
    { label: 'diàleg de confirmació' },
  )
  await evaluate(
    `[...document.querySelectorAll('.p-confirmdialog button')].find(b => b.innerText.trim() === 'Elimina').click()`,
  )
  await waitFor(
    async () => !((await evaluate('document.body.innerText')) || '').includes(newEmail),
    { label: 'usuari eliminat', timeout: 15000 },
  )
  check("Elimina un usuari des de la interfície", true)

  // 6. Navega a Rols
  await send('Page.navigate', { url: `${APP}/rols` })
  await waitFor(async () => ((await evaluate('document.body.innerText')) || '').includes('Rols del sistema'), { label: 'vista rols' })
  const rolesBody = await evaluate('document.body.innerText')
  check('La vista de rols carrega el rol admin', rolesBody.includes('admin'))

  // 6b. Permisos: crea i elimina un permís
  await send('Page.navigate', { url: `${APP}/permisos` })
  await waitFor(async () => ((await evaluate('document.body.innerText')) || '').includes('Permisos del sistema'), { label: 'vista permisos' })
  check('La vista de permisos carrega', true)

  const permName = `e2e_perm_${uniq}`
  await evaluate(
    `[...document.querySelectorAll('button')].find(b => b.innerText.includes('Nou permís')).click()`,
  )
  await waitFor(async () => await evaluate('!!document.querySelector("input#permission-name")'), {
    label: 'diàleg nou permís',
  })
  await evaluate(`
    (() => {
      const el = document.querySelector('input#permission-name')
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      s.call(el, '${permName}')
      el.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })()
  `)
  await evaluate(
    `[...document.querySelectorAll('.p-dialog button')].find(b => b.innerText.includes('Crea el permís')).click()`,
  )
  await waitFor(async () => ((await evaluate('document.body.innerText')) || '').includes(permName), {
    label: 'permís creat',
  })
  check('Crea un permís des de la interfície', true)

  await evaluate(`
    (() => {
      const row = [...document.querySelectorAll('tbody tr')].find((r) => r.innerText.includes('${permName}'))
      row.querySelector('button[aria-label="Elimina el permís"]').click()
      return true
    })()
  `)
  await waitFor(
    async () => await evaluate('!!document.querySelector(".p-confirmdialog")'),
    { label: 'confirmació eliminar permís' },
  )
  await evaluate(
    `[...document.querySelectorAll('.p-confirmdialog button')].find(b => b.innerText.trim() === 'Elimina').click()`,
  )
  await waitFor(
    async () => !((await evaluate('document.body.innerText')) || '').includes(permName),
    { label: 'permís eliminat', timeout: 15000 },
  )
  check('Elimina un permís des de la interfície', true)

  // 7. Perfil d'usuari (validació i desament)
  await send('Page.navigate', { url: `${APP}/perfil` })
  await waitFor(async () => ((await evaluate('document.body.innerText')) || '').includes('Dades del compte'), { label: 'vista perfil' })
  check('El perfil carrega les dades del compte', true)

  await evaluate(`
    (() => {
      const set = (sel, val) => {
        const el = document.querySelector(sel)
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        s.call(el, val)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
      set('input#profile-name', '')
      document.querySelector('form button[type=submit]').click()
      return true
    })()
  `)
  await waitFor(
    async () => ((await evaluate('document.body.innerText')) || '').includes('El nom és obligatori'),
    { label: 'validació nom buit' },
  )
  check('El perfil valida el nom buit', true)

  await evaluate(`
    (() => {
      const el = document.querySelector('input#profile-name')
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      s.call(el, 'Administrador')
      el.dispatchEvent(new Event('input', { bubbles: true }))
      document.querySelector('form button[type=submit]').click()
      return true
    })()
  `)
  await waitFor(
    async () => ((await evaluate('document.body.innerText')) || '').includes('Dades actualitzades'),
    { label: 'confirmació de desament', timeout: 15000 },
  )
  check('El perfil desa els canvis i confirma', true)

  // 8. Tanca la sessió
  await send('Page.navigate', { url: `${APP}/` })
  await waitFor(async () => ((await evaluate('document.body.innerText')) || '').includes('Tanca la sessió'), { label: 'botó logout' })
  await evaluate(`
    (() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.includes('Tanca la sessió'))
      btn.click()
      return true
    })()
  `)
  await waitFor(async () => (await evaluate('location.pathname')) === '/login', { label: 'logout -> /login', timeout: 15000 })
  check('El logout torna a la pàgina d\'accés', true)

  // 8. Protecció de rutes sense sessió
  await send('Page.navigate', { url: `${APP}/usuaris` })
  await sleep(1500)
  check('Ruta protegida sense sessió redirigeix a login', (await evaluate('location.pathname')) === '/login')

  check('Cap error a la consola del navegador', consoleErrors.length === 0, JSON.stringify(consoleErrors.slice(0, 3)))
} catch (error) {
  console.log(`FAIL - Excepció: ${error.message}`)
  try {
    console.log('--- location:', await evaluate('location.pathname'))
    console.log('--- body:', ((await evaluate('document.body.innerText')) || '').slice(0, 800))
    console.log('--- toast:', await evaluate(
      `[...document.querySelectorAll('.p-toast-message, .p-message')].map(e => e.innerText).join(' | ')`,
    ))
  } catch (e) {
    console.log('--- no es pot llegir l\'estat:', e.message)
  }
  console.log('--- console errors:', JSON.stringify(consoleErrors.slice(0, 5)))
  console.log('--- net errors:', JSON.stringify(netErrors.slice(0, 10)))
  failures++
} finally {
  try { ws?.close() } catch {}
  chrome.kill('SIGKILL')
}

console.log(`\n=== Resultat frontend: ${failures === 0 ? 'TOT OK' : failures + ' FALLIDES'} ===`)
process.exit(failures === 0 ? 0 : 1)
