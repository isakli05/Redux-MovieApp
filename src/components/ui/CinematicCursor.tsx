import { useEffect, useRef, useState } from 'react'

/**
 * CinematicCursor — "Cinematic Atlas" özel imleci (sahibin talebi).
 *
 * Yalnızca ince işaretçili (fare) cihazlarda ve prefers-reduced-motion yokken
 * çalışır: altın nokta (hızlı takip) + gecikmeli halka (etkileşimde büyür) +
 * arkasında sönen altın kıvılcım izi (canvas, transform/alpha only).
 * Metin alanlarında doğal I-beam imleci döner ve özel imleç gizlenir.
 * Dokunmatik/klavye kullanıcıları hiçbir şey görmez; yerel imleçleri kalır.
 */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
}

const GOLD = [232, 181, 77] as const
const GOLD_LIGHT = [245, 200, 102] as const
const MAX_PARTICLES = 140
const TRAIL_MIN_DISTANCE = 3

function usePointerFine(): boolean {
  const [fine, setFine] = useState(false)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(pointer: fine)')
    const set = () => setFine(mq.matches)
    set()
    mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }, [])
  return fine
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const set = () => setReduced(mq.matches)
    set()
    mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }, [])
  return reduced
}

export function CinematicCursor() {
  const fine = usePointerFine()
  const reduced = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const enabled = fine && !reduced

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const mouse = { x: -100, y: -100, seen: false }
    const dot = { x: -100, y: -100 }
    const ring = { x: -100, y: -100 }
    let ringScale = 1
    let ringTargetScale = 1
    let cursorVisible = true
    const particles: Particle[] = []

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const last = { x: -100, y: -100 }
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.seen = true

      const target = e.target as Element | null
      const interactive = target?.closest?.('a, button, [role="button"], summary, label, input[type="checkbox"], input[type="radio"]') != null
      ringTargetScale = interactive ? 1.9 : 1
      const overTextField = target?.closest?.('input, textarea, select, [contenteditable="true"]') != null
      if (overTextField !== !cursorVisible) cursorVisible = !overTextField

      const dx = mouse.x - last.x
      const dy = mouse.y - last.y
      if (last.x < 0 || dx * dx + dy * dy < TRAIL_MIN_DISTANCE * TRAIL_MIN_DISTANCE) return
      last.x = mouse.x
      last.y = mouse.y

      // Hız ile ölçeklenen kıvılcım: yavaş hareket az, hızlı hareket çok iz
      const speed = Math.min(Math.hypot(dx, dy), 40)
      const spawn = 1 + Math.round(speed / 14)
      for (let i = 0; i < spawn && particles.length < MAX_PARTICLES; i++) {
        particles.push({
          x: mouse.x + (Math.random() - 0.5) * 6,
          y: mouse.y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 0.6 - dx * 0.015,
          vy: (Math.random() - 0.5) * 0.6 - dy * 0.015,
          life: 1,
          size: 1.2 + Math.random() * 2.4
        })
      }
    }
    const onLeave = () => {
      mouse.seen = false
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)

    let prev = performance.now()
    const frame = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05)
      prev = now

      // Yumuşak takip: nokta hızlı, halka ağır (derinlik hissi)
      dot.x += (mouse.x - dot.x) * Math.min(1, dt * 22)
      dot.y += (mouse.y - dot.y) * Math.min(1, dt * 22)
      ring.x += (mouse.x - ring.x) * Math.min(1, dt * 10)
      ring.y += (mouse.y - ring.y) * Math.min(1, dt * 10)
      ringScale += (ringTargetScale - ringScale) * Math.min(1, dt * 12)

      ctx.clearRect(0, 0, width, height)
      if (mouse.seen && cursorVisible) {
        // Kıvılcım izi — additive blend ile sıcak altın parıltı
        ctx.globalCompositeOperation = 'lighter'
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]
          p.life -= dt / 0.55
          if (p.life <= 0) {
            particles.splice(i, 1)
            continue
          }
          p.x += p.vx
          p.y += p.vy
          const a = p.life * p.life * 0.85
          const [r, g, b] = p.life > 0.55 ? GOLD_LIGHT : GOLD
          ctx.beginPath()
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'

        // Halka
        ctx.beginPath()
        ctx.strokeStyle = `rgba(${GOLD[0]},${GOLD[1]},${GOLD[2]},0.85)`
        ctx.lineWidth = 1.5
        ctx.arc(ring.x, ring.y, 14 * ringScale, 0, Math.PI * 2)
        ctx.stroke()

        // Nokta (sıcak merkez)
        ctx.beginPath()
        ctx.fillStyle = `rgba(${GOLD_LIGHT[0]},${GOLD_LIGHT[1]},${GOLD_LIGHT[2]},0.95)`
        ctx.arc(dot.x, dot.y, 3.5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        particles.length = 0
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="cinematic-cursor"
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  )
}
