import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import * as THREE from 'three'

type LaptopIntroProps = {
  onComplete: () => void
}

const MOBILE_BREAKPOINT = 640
const DESKTOP_FOV = 38
const MOBILE_FOV = 78

export function LaptopIntro({ onComplete }: LaptopIntroProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const screenGroupRef = useRef<THREE.Group | null>(null)
  const orbitRef = useRef({ angle: 1.22, radius: 4.8, height: 1.75 })
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) {
      return
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#080b0d')
    const orbitState = orbitRef.current

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const isPortrait = mount.clientWidth < MOBILE_BREAKPOINT
    const camera = new THREE.PerspectiveCamera(
      isPortrait ? MOBILE_FOV : DESKTOP_FOV,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    )
    cameraRef.current = camera

    camera.position.set(
      Math.sin(orbitState.angle) * orbitState.radius,
      orbitState.height,
      Math.cos(orbitState.angle) * orbitState.radius,
    )
    camera.lookAt(0, 0.74, 0)

    const ambient = new THREE.HemisphereLight('#d7e4ef', '#1b1612', 1.2)
    scene.add(ambient)

    const key = new THREE.DirectionalLight('#fff4dc', 2.5)
    key.position.set(3, 5, 4)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    scene.add(key)

    const rim = new THREE.PointLight('#7ec8ff', 1.2, 7)
    rim.position.set(-3, 2.2, -2.8)
    scene.add(rim)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({
        color: '#0b0f12',
        roughness: 0.8,
        metalness: 0.08,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    const table = new THREE.Group()
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(1.92, 1.92, 0.14, 96),
      new THREE.MeshPhysicalMaterial({
        color: '#2b2a27',
        roughness: 0.36,
        metalness: 0.12,
        clearcoat: 0.55,
        clearcoatRoughness: 0.28,
      }),
    )
    top.position.y = 0.58
    top.scale.z = 0.72
    top.castShadow = true
    top.receiveShadow = true
    table.add(top)

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, 0.62, 40),
      new THREE.MeshStandardMaterial({ color: '#171b1f', roughness: 0.34, metalness: 0.8 }),
    )
    stem.position.y = 0.25
    stem.castShadow = true
    table.add(stem)

    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.72, 0.045, 64),
      new THREE.MeshStandardMaterial({ color: '#11151a', roughness: 0.45, metalness: 0.65 }),
    )
    foot.position.y = 0.03
    foot.scale.z = 0.72
    foot.castShadow = true
    foot.receiveShadow = true
    table.add(foot)
    scene.add(table)

    const laptop = new THREE.Group()
    laptop.position.set(0.05, 0.68, 0.04)
    laptop.rotation.y = -0.08
    scene.add(laptop)

    const aluminum = new THREE.MeshPhysicalMaterial({
      color: '#b9bec2',
      roughness: 0.24,
      metalness: 0.68,
      clearcoat: 0.3,
    })
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.07, 1.52), aluminum)
    base.position.y = 0.035
    base.castShadow = true
    base.receiveShadow = true
    laptop.add(base)

    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(1.58, 0.012, 0.68),
      new THREE.MeshStandardMaterial({ color: '#15191d', roughness: 0.42, metalness: 0.35 }),
    )
    keyboard.position.set(0, 0.082, 0.12)
    keyboard.castShadow = true
    laptop.add(keyboard)

    const trackpad = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.014, 0.35),
      new THREE.MeshStandardMaterial({ color: '#7d858b', roughness: 0.32, metalness: 0.5 }),
    )
    trackpad.position.set(0, 0.086, 0.55)
    laptop.add(trackpad)

    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 2.42, 32),
      new THREE.MeshStandardMaterial({ color: '#9aa1a6', roughness: 0.22, metalness: 0.7 }),
    )
    hinge.rotation.z = Math.PI / 2
    hinge.position.set(0, 0.105, -0.77)
    laptop.add(hinge)

    const screenGroup = new THREE.Group()
    screenGroup.position.set(0, 0.09, -0.77)
    screenGroup.rotation.x = -1.18
    screenGroupRef.current = screenGroup
    laptop.add(screenGroup)

    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.48, 1.5, 0.055), aluminum)
    lid.position.set(0, 0.75, -0.03)
    lid.castShadow = true
    lid.receiveShadow = true
    screenGroup.add(lid)

    const screenCanvas = document.createElement('canvas')
    screenCanvas.width = 900
    screenCanvas.height = 540
    const ctx = screenCanvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 900, 540)
      gradient.addColorStop(0, '#0c1520')
      gradient.addColorStop(0.55, '#102c38')
      gradient.addColorStop(1, '#061013')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 900, 540)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(0, 0, 900, 38)
      ctx.fillStyle = '#dfe8eb'
      ctx.font = '700 34px ui-monospace, monospace'
      ctx.fillText('KACPER DESKTOP', 44, 96)
      ctx.fillStyle = '#90f7d0'
      ctx.font = '24px ui-monospace, monospace'
      ctx.fillText('opening workspace...', 44, 142)
      ctx.fillStyle = 'rgba(144,247,208,0.55)'
      for (let y = 185; y < 455; y += 42) {
        ctx.fillRect(44, y, 360 + Math.random() * 260, 2)
      }
    }
    const screenTexture = new THREE.CanvasTexture(screenCanvas)
    screenTexture.colorSpace = THREE.SRGBColorSpace

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.16, 1.2),
      new THREE.MeshBasicMaterial({ map: screenTexture }),
    )
    screen.position.set(0, 0.75, -0.064)
    screen.rotation.y = Math.PI
    screenGroup.add(screen)

    const glow = new THREE.PointLight('#75ffd3', 0.35, 3.2)
    glow.position.set(0, 0.8, 0.05)
    screenGroup.add(glow)

    const vignette = new THREE.Mesh(
      new THREE.SphereGeometry(9, 32, 32),
      new THREE.MeshBasicMaterial({
        color: '#07090c',
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.55,
      }),
    )
    scene.add(vignette)

    let frame = 0
    let pointerX = 0
    let pointerY = 0
    let running = true

    function updateCameraFromOrbit() {
      const current = orbitRef.current
      const isNarrow = window.innerWidth < MOBILE_BREAKPOINT
      const viewportRadius = current.radius * (isNarrow ? 1.55 : 1)
      const targetX = isNarrow ? 0.38 : 0
      camera.position.set(
        Math.sin(current.angle) * viewportRadius + pointerX * 0.12,
        current.height + pointerY * 0.08,
        Math.cos(current.angle) * viewportRadius,
      )
      camera.lookAt(targetX, 0.82, -0.08)
    }

    function animate() {
      if (!running) {
        return
      }

      frame += 1
      table.rotation.y += 0.0008
      laptop.position.y = 0.68 + Math.sin(frame * 0.015) * 0.004
      updateCameraFromOrbit()
      renderer.render(scene, camera)
      window.requestAnimationFrame(animate)
    }

    function handleResize() {
      if (!mount) {
        return
      }
      const width = mount.clientWidth
      const height = mount.clientHeight
      camera.aspect = width / height
      camera.fov = width < MOBILE_BREAKPOINT ? MOBILE_FOV : DESKTOP_FOV
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    function handlePointerMove(event: PointerEvent) {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2
      pointerY = -(event.clientY / window.innerHeight - 0.5) * 2
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('pointermove', handlePointerMove)
    animate()

    return () => {
      running = false
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', handlePointerMove)
      gsap.killTweensOf(orbitState)
      if (screenGroupRef.current) {
        gsap.killTweensOf(screenGroupRef.current.rotation)
      }
      renderer.dispose()
      screenTexture.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  function enterWorkspace() {
    if (started) {
      return
    }
    setStarted(true)

    const orbit = orbitRef.current
    const screenGroup = screenGroupRef.current

    if (screenGroup) {
      gsap.to(screenGroup.rotation, {
        x: 0.04,
        duration: 3.2,
        ease: 'power3.inOut',
      })
    }

    gsap
      .timeline({
        onComplete,
      })
      .to(orbit, {
        angle: 0.03,
        radius: 2.95,
        height: 1.26,
        duration: 3.25,
        ease: 'power3.inOut',
      })
      .to(
        orbit,
        {
          radius: 2.26,
          height: 1.08,
          duration: 0.78,
          ease: 'power2.inOut',
        },
        '-=0.72',
      )
  }

  return (
    <section className="intro-scene" aria-label="MacBook 3D intro">
      <div ref={mountRef} className="three-stage" aria-hidden="true"></div>
      <button className="intro-hotspot" type="button" onClick={enterWorkspace}>
        <span>{started ? 'Opening workspace' : 'Enter workspace'}</span>
      </button>
      <div className="intro-caption">
        <p>Right-profile MacBook / luxury table / smooth orbit boot</p>
      </div>
    </section>
  )
}
