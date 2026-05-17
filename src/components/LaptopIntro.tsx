import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MacDesktop } from './MacDesktop'

const DESK_URL = '/models/wooden-desk.glb'
const MACBOOK_URL = '/models/macbook-pro-m3.glb'
const MOBILE_BREAKPOINT = 640
const DESKTOP_FOV = 42
const MOBILE_FOV = 72
const DESK_SCALE = 1.05
const TABLE_SURFACE_Y = 2.405
const LAPTOP_WORLD_WIDTH = 1.22
const CLOSED_LID_ROTATION = -1.16
const OPEN_LID_ROTATION = -0.18

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return
    }

    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => material.dispose())
  })
}

function prepareModel(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return
    }

    object.castShadow = true
    object.receiveShadow = true

    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.envMapIntensity = 1.15
        material.needsUpdate = true
      }
    })
  })
}

function muteBuiltInDisplay(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => {
      if (!(material instanceof THREE.MeshStandardMaterial)) {
        return
      }

      const hasBrightScreenEmissive = material.emissive.getHSL({ h: 0, s: 0, l: 0 }).l > 0.45
      if (material.name === 'sfCQkHOWyrsLmor' || hasBrightScreenEmissive) {
        material.color.set('#020304')
        material.emissive.set('#000000')
        material.emissiveIntensity = 0
        material.map = null
        material.needsUpdate = true
      }
    })
  })
}

function createScreenBootTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 540
  const ctx = canvas.getContext('2d')

  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 900, 540)
    gradient.addColorStop(0, '#07111a')
    gradient.addColorStop(0.58, '#10313d')
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
    ctx.fillText('loading workspace...', 44, 142)
    ctx.fillStyle = 'rgba(144,247,208,0.55)'
    for (let y = 185; y < 455; y += 42) {
      ctx.fillRect(44, y, 430 + Math.random() * 180, 2)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function LaptopIntro() {
  const mountRef = useRef<HTMLDivElement>(null)
  const lidPivotRef = useRef<THREE.Group | null>(null)
  const screenMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null)
  const screenPlaneRef = useRef<THREE.Mesh | null>(null)
  const hitTargetRef = useRef<THREE.Object3D | null>(null)
  const assetReadyRef = useRef(false)
  const startedRef = useRef(false)
  const orbitRef = useRef({
    angle: 1.28,
    radius: 3.9,
    height: 3.05,
    targetX: 0.18,
    targetY: 2.42,
    targetZ: -0.72,
  })
  const [screenActive, setScreenActive] = useState(false)
  const [started, setStarted] = useState(false)

  const beginExperience = useCallback(() => {
    if (startedRef.current || !assetReadyRef.current) {
      return
    }

    startedRef.current = true
    setStarted(true)

    const orbit = orbitRef.current
    const lidPivot = lidPivotRef.current

    if (lidPivot) {
      gsap.to(lidPivot.rotation, {
        x: OPEN_LID_ROTATION,
        duration: 3.25,
        ease: 'power3.inOut',
      })
    }

    if (screenMaterialRef.current) {
      gsap.to(screenMaterialRef.current, {
        opacity: 1,
        duration: 0.72,
        delay: 2.35,
        ease: 'power2.out',
      })
    }

    gsap
      .timeline()
      .to(orbit, {
        angle: 0.08,
        radius: 2.35,
        height: 2.95,
        targetX: 0.18,
        targetY: 2.68,
        targetZ: -1.18,
        duration: 3.7,
        ease: 'power3.inOut',
      })
      .to(
        orbit,
        {
          angle: 0.035,
          radius: 1.68,
          height: 2.86,
          targetY: 2.72,
          targetZ: -1.28,
          duration: 1,
          ease: 'power2.inOut',
        },
        '-=0.86',
      )
      .call(() => setScreenActive(true), [], 3.35)
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) {
      return
    }
    const stage = mount

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#07090b')
    const orbitState = orbitRef.current
    const loadedRoots: THREE.Object3D[] = []
    const loader = new GLTFLoader()
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const screenCorners = [
      new THREE.Vector3(-13.05, 7.55, 0),
      new THREE.Vector3(13.05, 7.55, 0),
      new THREE.Vector3(13.05, -7.55, 0),
      new THREE.Vector3(-13.05, -7.55, 0),
    ]

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(stage.clientWidth, stage.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    stage.appendChild(renderer.domElement)

    const isPortrait = stage.clientWidth < MOBILE_BREAKPOINT
    const camera = new THREE.PerspectiveCamera(
      isPortrait ? MOBILE_FOV : DESKTOP_FOV,
      stage.clientWidth / stage.clientHeight,
      0.1,
      100,
    )

    const ambient = new THREE.HemisphereLight('#f4f7fb', '#15100d', 1.42)
    scene.add(ambient)

    const key = new THREE.DirectionalLight('#fff3dc', 3.15)
    key.position.set(4.4, 6.2, 4.8)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -6
    key.shadow.camera.right = 6
    key.shadow.camera.top = 6
    key.shadow.camera.bottom = -6
    scene.add(key)

    const coolRim = new THREE.PointLight('#8fd2ff', 2.25, 10)
    coolRim.position.set(-4.6, 3.4, -3.3)
    scene.add(coolRim)

    const warmStrip = new THREE.PointLight('#ffe0b0', 1.65, 8)
    warmStrip.position.set(2.8, 2.7, 2.9)
    scene.add(warmStrip)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 28),
      new THREE.MeshStandardMaterial({
        color: '#080b0d',
        roughness: 0.78,
        metalness: 0.05,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 9),
      new THREE.MeshStandardMaterial({
        color: '#090d10',
        roughness: 0.86,
        metalness: 0.02,
      }),
    )
    backWall.position.set(0, 4.5, -6.4)
    backWall.receiveShadow = true
    scene.add(backWall)

    const screenTexture = createScreenBootTexture()
    let running = true
    let frame = 0
    let pointerX = 0
    let pointerY = 0

    loader.load(
      DESK_URL,
      (gltf) => {
        if (!running) {
          disposeObject(gltf.scene)
          return
        }

        const desk = gltf.scene
        prepareModel(desk)
        desk.name = 'Wooden desk with chairs'
        const woodLift = new THREE.Color('#7a654d')

        desk.traverse((object) => {
          if (object.name.toLowerCase().includes('chair')) {
            object.visible = false
          }

          if (object instanceof THREE.Mesh) {
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            materials.forEach((material) => {
              if (material instanceof THREE.MeshStandardMaterial) {
                material.color.lerp(woodLift, 0.18)
                material.roughness = Math.min(material.roughness + 0.08, 0.95)
              }
            })
          }
        })

        desk.scale.setScalar(DESK_SCALE)
        desk.rotation.y = 0.02
        desk.position.set(0, 0, -0.18)
        scene.add(desk)
        loadedRoots.push(desk)
      },
      undefined,
      (error) => console.error('Desk model failed to load', error),
    )

    loader.load(
      MACBOOK_URL,
      (gltf) => {
        if (!running) {
          disposeObject(gltf.scene)
          return
        }

        const macbook = gltf.scene
        prepareModel(macbook)
        muteBuiltInDisplay(macbook)
        macbook.name = 'MacBook Pro M3 16 inch'
        macbook.updateMatrixWorld(true)

        const rawBox = new THREE.Box3().setFromObject(macbook)
        const rawSize = new THREE.Vector3()
        rawBox.getSize(rawSize)
        const modelScale = LAPTOP_WORLD_WIDTH / rawSize.x

        const lidPivot = new THREE.Group()
        lidPivot.name = 'MacBook lid pivot'
        lidPivot.position.set(0, 0.2, -12.1)
        macbook.add(lidPivot)
        macbook.updateMatrixWorld(true)

        const lidMeshes: THREE.Mesh[] = []
        macbook.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) {
            return
          }

          const box = new THREE.Box3().setFromObject(object)
          const center = new THREE.Vector3()
          box.getCenter(center)
          if (center.y > 1.1 && center.z < -8.2) {
            lidMeshes.push(object)
          }
        })
        lidMeshes.forEach((mesh) => lidPivot.attach(mesh))
        lidPivot.rotation.x = CLOSED_LID_ROTATION
        lidPivotRef.current = lidPivot

        const screenMaterial = new THREE.MeshBasicMaterial({
          map: screenTexture,
          opacity: 0,
          toneMapped: false,
          transparent: true,
        })
        const screenPlane = new THREE.Mesh(new THREE.PlaneGeometry(26.1, 15.1), screenMaterial)
        screenPlane.name = 'Kacper desktop boot screen'
        screenPlane.position.set(0, 11.02, -16.12)
        screenPlane.rotation.x = -0.36
        screenPlane.rotation.y = Math.PI
        lidPivot.add(screenPlane)
        screenMaterialRef.current = screenMaterial
        screenPlaneRef.current = screenPlane

        macbook.scale.setScalar(modelScale)
        macbook.rotation.y = -0.08
        const macbookBaseY = TABLE_SURFACE_Y - rawBox.min.y * modelScale + 0.035
        macbook.position.set(0.2, macbookBaseY, -0.3)
        macbook.userData.baseY = macbookBaseY
        scene.add(macbook)
        loadedRoots.push(macbook)
        hitTargetRef.current = macbook
        assetReadyRef.current = true
        stage.classList.add('is-laptop-ready')
      },
      undefined,
      (error) => console.error('MacBook model failed to load', error),
    )

    function updateCameraFromOrbit() {
      const current = orbitRef.current
      const isNarrow = window.innerWidth < MOBILE_BREAKPOINT
      const viewportRadius = current.radius * (isNarrow ? (startedRef.current ? 1 : 1.22) : 1)
      const target = new THREE.Vector3(current.targetX, current.targetY, current.targetZ)
      const lookAmountX = startedRef.current ? 0.055 : 0.16
      const lookAmountY = startedRef.current ? 0.035 : 0.1

      camera.position.set(
        target.x + Math.sin(current.angle) * viewportRadius + pointerX * lookAmountX,
        current.height + pointerY * lookAmountY,
        target.z + Math.cos(current.angle) * viewportRadius,
      )
      camera.lookAt(target)
    }

    function updateScreenOverlayRect() {
      const screenPlane = screenPlaneRef.current
      if (!screenPlane) {
        return
      }

      screenPlane.updateWorldMatrix(true, false)
      const projected = screenCorners.map((corner) =>
        corner.clone().applyMatrix4(screenPlane.matrixWorld).project(camera),
      )
      const width = stage.clientWidth
      const height = stage.clientHeight
      const xs = projected.map((point) => (point.x * 0.5 + 0.5) * width)
      const ys = projected.map((point) => (-point.y * 0.5 + 0.5) * height)
      const left = Math.min(...xs)
      const right = Math.max(...xs)
      const top = Math.min(...ys)
      const bottom = Math.max(...ys)

      const overlayRoot = stage.parentElement ?? stage
      overlayRoot.style.setProperty('--screen-left', `${left}px`)
      overlayRoot.style.setProperty('--screen-top', `${top}px`)
      overlayRoot.style.setProperty('--screen-width', `${right - left}px`)
      overlayRoot.style.setProperty('--screen-height', `${bottom - top}px`)
    }

    function raycastLaptop(event: PointerEvent) {
      const target = hitTargetRef.current
      if (!target) {
        return false
      }

      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      return raycaster.intersectObject(target, true).length > 0
    }

    function animate() {
      if (!running) {
        return
      }

      frame += 1
      loadedRoots.forEach((root) => {
        if (root.name === 'MacBook Pro M3 16 inch') {
          root.position.y = root.userData.baseY + Math.sin(frame * 0.015) * 0.002
        }
      })
      updateCameraFromOrbit()
      updateScreenOverlayRect()
      renderer.render(scene, camera)
      window.requestAnimationFrame(animate)
    }

    function handleResize() {
      const width = stage.clientWidth
      const height = stage.clientHeight
      camera.aspect = width / height
      camera.fov = width < MOBILE_BREAKPOINT ? MOBILE_FOV : DESKTOP_FOV
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    function handlePointerMove(event: PointerEvent) {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2
      pointerY = -(event.clientY / window.innerHeight - 0.5) * 2

      if (!assetReadyRef.current || startedRef.current) {
        stage.style.cursor = 'default'
        return
      }
      stage.style.cursor = raycastLaptop(event) ? 'pointer' : 'default'
    }

    function handlePointerDown(event: PointerEvent) {
      if (!assetReadyRef.current || startedRef.current) {
        return
      }

      if (raycastLaptop(event) || window.innerWidth < MOBILE_BREAKPOINT) {
        beginExperience()
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('pointermove', handlePointerMove)
    stage.addEventListener('pointerdown', handlePointerDown)
    animate()

    return () => {
      running = false
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', handlePointerMove)
      stage.removeEventListener('pointerdown', handlePointerDown)
      gsap.killTweensOf(orbitState)
      if (lidPivotRef.current) {
        gsap.killTweensOf(lidPivotRef.current.rotation)
      }
      if (screenMaterialRef.current) {
        gsap.killTweensOf(screenMaterialRef.current)
      }
      loadedRoots.forEach(disposeObject)
      screenTexture.dispose()
      renderer.dispose()
      stage.removeChild(renderer.domElement)
      const overlayRoot = stage.parentElement ?? stage
      overlayRoot.style.removeProperty('--screen-left')
      overlayRoot.style.removeProperty('--screen-top')
      overlayRoot.style.removeProperty('--screen-width')
      overlayRoot.style.removeProperty('--screen-height')
    }
  }, [beginExperience])

  return (
    <section className={`intro-scene ${started ? 'is-seating' : ''}`} aria-label="MacBook 3D intro">
      <div ref={mountRef} className="three-stage" aria-hidden="true"></div>
      <div className={`laptop-screen-ui ${screenActive ? 'is-active' : ''}`} aria-hidden={!screenActive}>
        <MacDesktop />
      </div>
    </section>
  )
}
