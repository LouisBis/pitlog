import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js'
import { useTranslation } from 'react-i18next'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { t } = useTranslation()
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
    camera.position.z = 4

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const key = new THREE.PointLight(0xffffff, 10)
    key.position.set(5, 5, 6)
    scene.add(key)
    const fill = new THREE.PointLight(0xffffff, 3)
    fill.position.set(-4, -2, 4)
    scene.add(fill)

    const mat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 80 })
    const wheel = new THREE.Group()

    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.2, 20, 80), mat))
    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.055, 16, 60), mat))

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 16), mat)
    hub.rotation.x = Math.PI / 2
    wheel.add(hub)

    const SPOKES = 9
    for (let i = 0; i < SPOKES; i++) {
      const angle = (i / SPOKES) * Math.PI * 2
      const spokeLen = 1.04
      const spoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, spokeLen, 6),
        mat,
      )
      spoke.position.set(Math.cos(angle) * 0.66, Math.sin(angle) * 0.66, 0)
      spoke.rotation.z = angle - Math.PI / 2
      wheel.add(spoke)
    }

    wheel.rotation.x = 0.3
    scene.add(wheel)

    const renderer = new THREE.WebGLRenderer()
    const effect = new AsciiEffect(renderer, ' .,:;=+xX$&#@', { invert: true })
    effect.setSize(w, h)
    effect.domElement.style.color = 'var(--brand-accent)'
    effect.domElement.style.backgroundColor = 'transparent'
    container.appendChild(effect.domElement)

    const clock = new THREE.Clock()
    let rafId: number

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()
      wheel.rotation.z = -elapsed * 0.5
      wheel.rotation.y = Math.sin(elapsed * 0.3) * 0.4
      effect.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const nw = container.clientWidth
      const nh = container.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
      effect.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      if (container.contains(effect.domElement)) container.removeChild(effect.domElement)
      mat.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div className={styles.page}>
      <div ref={mountRef} className={styles.scene} />
      <div className={styles.overlay}>
        <p className={styles.logo}>Pitlog</p>
        <p className={styles.tagline}>{t('garage.tagline')}</p>
        <Link to="/garage" className={styles.cta}>{t('home.cta')}</Link>
      </div>
    </div>
  )
}
