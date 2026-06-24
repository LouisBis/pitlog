import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import styles from './HomePage.module.css'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
}

const overlayVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
}

export default function HomePage() {
  const { t } = useTranslation()
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100)
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
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.04, 6), mat)
      spoke.position.set(Math.cos(angle) * 0.66, Math.sin(angle) * 0.66, 0)
      spoke.rotation.z = angle - Math.PI / 2
      wheel.add(spoke)
    }

    scene.add(wheel)

    const renderer = new THREE.WebGLRenderer()
    const effect = new AsciiEffect(renderer, ' .,:;=+xX$&#@', { invert: true })
    effect.setSize(w, h)
    Object.assign(effect.domElement.style, {
      position: 'absolute',
      inset: '0',
      color: 'var(--brand-accent)',
      backgroundColor: 'transparent',
      transform: 'translateX(-2.5rem)',
    })
    container.appendChild(effect.domElement)

    const clock = new THREE.Clock()
    let rafId: number

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()
      wheel.rotation.z = -elapsed * 0.5
      wheel.rotation.y = elapsed * 0.28
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

      <motion.div
        className={styles.overlay}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.divider} variants={fadeUp} />
        <motion.p className={styles.logo} variants={fadeUp}>Pitlog</motion.p>
        <motion.p className={styles.tagline} variants={fadeUp}>{t('garage.tagline')}</motion.p>
        <motion.p className={styles.tagline2} variants={fadeUp}>{t('home.tagline2')}</motion.p>
        <motion.div className={styles.divider} variants={fadeUp} />
        <motion.div variants={fadeUp}>
          <Link to="/garage" className={styles.cta}>{t('home.cta')}</Link>
        </motion.div>
      </motion.div>

      <motion.span
        className={styles.version}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
      >
        v{__APP_VERSION__}
      </motion.span>
    </div>
  )
}
