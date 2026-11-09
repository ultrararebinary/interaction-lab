// The systematic part of a wave's checks, run against the dev server (`npm run dev` first):
//
//   npm run check                 every card
//   npm run check -- --wave 3     only the cards of wave 3
//
// For each card, in both themes, with and without reduced motion, at 390 px and at 1280 px, it
// looks for console errors and for text that overflows. At 390 px it also smoke-tests the stage:
// a mouse click, a mouse drag across the middle and a touch tap. It saves one picture per card,
// theme and motion setting in .lab/shots/, to look at.
//
// It does not prove that a gesture feels right or that reduced motion is respected in spirit:
// that still takes trying each card by hand. It drives Chrome through the DevTools protocol, so it
// needs no dependency: Node 22 or newer and a Chrome install (CHROME_PATH if it lives elsewhere).
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const URL_ = process.env.LAB_URL ?? 'http://localhost:4330/interaction-lab/'
const CDP_PORT = 9335
const CHROME =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const waveArg = process.argv.indexOf('--wave')
const WAVE = waveArg > -1 ? Number(process.argv[waveArg + 1]) : null
const SHOTS = join(ROOT, '.lab', 'shots')

async function connect() {
  let target
  for (let i = 0; i < 100 && !target; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
      target = targets.find((t) => t.type === 'page')
    } catch {}
    if (!target) await sleep(100)
  }
  if (!target) throw new Error('Chrome did not open a page. Set CHROME_PATH if it lives elsewhere.')

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = reject
  })
  let id = 0
  const pending = new Map()
  const handlers = new Map()
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.method) return handlers.get(msg.method)?.(msg.params)
    const call = pending.get(msg.id)
    if (!call) return
    pending.delete(msg.id)
    if (msg.error) call.reject(new Error(msg.error.message))
    else call.resolve(msg.result)
  }
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id
      pending.set(n, { resolve, reject })
      ws.send(JSON.stringify({ id: n, method, params }))
    })
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'evaluate failed')
    return result.value
  }
  return { send, evaluate, on: (method, fn) => handlers.set(method, fn), close: () => ws.close() }
}

// Stack traces stay out of the report: the first line says what broke.
const firstLine = (text) => String(text).split('\n')[0]
const errors = []
const warnings = []
let context = ''

async function open(page, { theme, motion, width }) {
  context = `${theme}, ${motion === 'reduce' ? 'reduced motion' : 'motion'}, ${width} px`
  const mobile = width < 600
  await page.send('Emulation.setDeviceMetricsOverride', {
    width,
    height: 900,
    deviceScaleFactor: 2,
    mobile,
  })
  await page.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 })
  await page.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: motion },
      { name: 'prefers-color-scheme', value: theme },
    ],
  })
  await page.send('Page.navigate', { url: URL_ })
  await sleep(300)
  await page.evaluate(`localStorage.setItem('theme', '${theme}')`).catch(() => {})
  await page.send('Page.navigate', { url: URL_ })
  for (let i = 0; i < 100; i++) {
    const ready = await page
      .evaluate(`!!document.querySelector('.card, .empty') && !!document.querySelector('.review-bar')`)
      .catch(() => false)
    if (ready) break
    await sleep(100)
  }
  await page.evaluate(`document.fonts.ready.then(() => true)`)
  await sleep(700)
}

async function cardsOf(page) {
  const all = await page.evaluate(`[...document.querySelectorAll('[data-card]')].map((card) => ({
    slug: card.dataset.card,
    wave: Number(card.querySelector('.card__wave')?.textContent.replace(/\\D/g, '') ?? NaN),
  }))`)
  return WAVE === null ? all : all.filter((c) => c.wave === WAVE)
}

// Viewport coordinates, for input events. With `page`, coordinates in the document, which is what
// a screenshot clip expects once captureBeyondViewport is on.
async function rectOf(page, selector, { inPage = false } = {}) {
  return page.evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)})
    el.scrollIntoView({ block: 'center' })
    const r = el.getBoundingClientRect()
    const dx = ${inPage} ? scrollX : 0
    const dy = ${inPage} ? scrollY : 0
    return { x: r.x + dx, y: r.y + dy, width: r.width, height: r.height }
  })()`)
}

async function overflow(page, slug) {
  const result = await page.evaluate(`(() => {
    const card = document.querySelector('[data-card="${slug}"]')
    const parts = ['.card__head', '.card__foot', '.card__stage']
      .map((s) => card.querySelector(s))
      .filter((el) => el && el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.className)
    return { page: document.documentElement.scrollWidth > innerWidth, parts }
  })()`)
  if (result.page) errors.push(`[${context}] the page scrolls sideways`)
  for (const part of result.parts) {
    const message = `[${context}] ${slug}: ${part} is wider than the card`
    // A stage clips its content, so wide content there may be on purpose: a warning, not an error.
    if (part.includes('stage')) warnings.push(message)
    else errors.push(message)
  }
}

async function smoke(page, slug) {
  const r = await rectOf(page, `[data-card="${slug}"] .card__stage`)
  const x = r.x + r.width / 2
  const y = r.y + r.height / 2
  const mouse = (type, px, buttons = 1) =>
    page.send('Input.dispatchMouseEvent', { type, x: px, y, button: 'left', buttons, clickCount: 1 })
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
  await mouse('mousePressed', x)
  await mouse('mouseReleased', x, 0)
  await sleep(300)
  await mouse('mousePressed', x - 60)
  for (let i = 1; i <= 8; i++) await mouse('mouseMoved', x - 60 + i * 15)
  await mouse('mouseReleased', x + 60, 0)
  await sleep(300)
  const touch = (type, points) => page.send('Input.dispatchTouchEvent', { type, touchPoints: points })
  await touch('touchStart', [{ x, y }])
  await touch('touchEnd', [])
  await sleep(400)
}

async function shot(page, slug, name) {
  const r = await rectOf(page, `[data-card="${slug}"]`, { inPage: true })
  await sleep(150)
  const { data } = await page.send('Page.captureScreenshot', {
    format: 'png',
    clip: { ...r, scale: 1 },
    captureBeyondViewport: true,
  })
  await writeFile(join(SHOTS, `${slug}-${name}.png`), Buffer.from(data, 'base64'))
}

async function main() {
  try {
    if (!(await fetch(URL_)).ok) throw new Error()
  } catch {
    throw new Error(`Nothing answers at ${URL_}. Start the dev server first: npm run dev`)
  }
  await mkdir(SHOTS, { recursive: true })
  const profile = await mkdtemp(join(tmpdir(), 'lab-check-'))
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--hide-scrollbars',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  try {
    const page = await connect()
    await page.send('Runtime.enable')
    await page.send('Log.enable')
    page.on('Runtime.exceptionThrown', (p) =>
      errors.push(`[${context}] uncaught: ${firstLine(p.exceptionDetails.exception?.description ?? p.exceptionDetails.text)}`),
    )
    page.on('Runtime.consoleAPICalled', (p) => {
      if (p.type !== 'error') return
      errors.push(`[${context}] console.error: ${firstLine(p.args.map((a) => a.value ?? a.description).join(' '))}`)
    })
    page.on('Log.entryAdded', ({ entry }) => {
      if (entry.level === 'error') errors.push(`[${context}] ${entry.source}: ${entry.text} ${entry.url ?? ''}`)
    })

    let slugs = []
    for (const theme of ['dark', 'light']) {
      for (const motion of ['no-preference', 'reduce']) {
        for (const width of [390, 1280]) {
          await open(page, { theme, motion, width })
          const cards = await cardsOf(page)
          slugs = cards.map((c) => c.slug)
          for (const { slug } of cards) {
            await overflow(page, slug)
            if (width === 390) {
              await shot(page, slug, `${theme}${motion === 'reduce' ? '-reduced' : ''}`)
              await smoke(page, slug)
            }
          }
        }
      }
    }
    page.close()

    console.log(`Checked ${slugs.length} card(s)${WAVE === null ? '' : ` of wave ${WAVE}`}: ${slugs.join(', ') || 'none'}`)
    console.log(`Pictures: ${SHOTS}`)
    for (const w of warnings) console.log(`warning: ${w}`)
    if (errors.length) {
      console.error(`\n${errors.length} problem(s):\n- ${[...new Set(errors)].join('\n- ')}`)
      process.exitCode = 1
    } else {
      console.log('No console errors, nothing overflows.')
    }
  } finally {
    chrome.kill()
    await rm(profile, { recursive: true, force: true }).catch(() => {})
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
