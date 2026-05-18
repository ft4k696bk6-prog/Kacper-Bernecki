import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { MacDesktop } from './MacDesktop'

const MACBOOK_URL = '/models/macbook-pro-m3.glb'
const STUDIO_HDR_URL = '/hdr/studio_small_09_1k.hdr'
const WOOD_DIFFUSE_URL = '/textures/wood_table/diff.jpg'
const WOOD_NORMAL_URL = '/textures/wood_table/normal.jpg'
const MOBILE_BREAKPOINT = 640
const DESKTOP_FOV = 38
const MOBILE_FOV = 64
const TABLE_SURFACE_Y = 1.08
const LAPTOP_WORLD_WIDTH = 1.28
const CLOSED_LID_ROTATION = -1.16
const OPEN_LID_ROTATION = -0.18
const TABLE_WIDTH = 5.4
const TABLE_DEPTH = 3.15
const TABLE_THICKNESS = 0.16

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return
    }

    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) {
          value.dispose()
        }
      })
      material.dispose()
    })
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
        const color = material.color
        const isSilverBody =
          material.metalness > 0.7 && color.r > 0.42 && color.g > 0.42 && color.b > 0.42

        if (isSilverBody) {
          material.color.set('#bfc1bd')
          material.metalness = 0.78
          material.roughness = 0.34
          material.envMapIntensity = 1.55
        } else {
          material.roughness = Math.max(material.roughness, 0.42)
          material.envMapIntensity = 1.05
        }
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

    const box = new THREE.Box3().setFromObject(object)
    const center = new THREE.Vector3()
    box.getCenter(center)
    const isDisplayAssembly = center.y > 1.1 && center.z < -8.2
    if (!isDisplayAssembly) {
      return
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => {
      if (!(material instanceof THREE.MeshStandardMaterial)) {
        return
      }

      const hasBrightScreenEmissive = material.emissive.getHSL({ h: 0, s: 0, l: 0 }).l > 0.45
      const brightness = (material.color.r + material.color.g + material.color.b) / 3
      const isScreenGlass = material.name === 'sfCQkHOWyrsLmor' || hasBrightScreenEmissive || brightness < 0.18

      material.map = null
      material.normalMap = null
      material.roughnessMap = null
      material.metalnessMap = null
      material.emissiveMap = null

      if (isScreenGlass) {
        material.color.set('#020304')
        material.emissive.set('#000000')
        material.emissiveIntensity = 0
        material.metalness = 0.12
        material.roughness = 0.08
        material.envMapIntensity = 1.28
      } else {
        material.color.set('#bfc1bd')
        material.metalness = 0.78
        material.roughness = 0.31
        material.envMapIntensity = 1.48
      }
      material.needsUpdate = true
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

function configureTexture(texture: THREE.Texture, repeatX: number, repeatY: number, colorSpace?: THREE.ColorSpace) {
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  texture.anisotropy = 8
  if (colorSpace) {
    texture.colorSpace = colorSpace
  }
}

function createStudioTable(textureLoader: THREE.TextureLoader) {
  const table = new THREE.Group()
  table.name = 'Minimal oak studio table'

  const woodDiffuse = textureLoader.load(WOOD_DIFFUSE_URL)
  const woodNormal = textureLoader.load(WOOD_NORMAL_URL)
  configureTexture(woodDiffuse, 3.4, 1.8, THREE.SRGBColorSpace)
  configureTexture(woodNormal, 3.4, 1.8)

  const tabletop = new THREE.Mesh(
    new RoundedBoxGeometry(TABLE_WIDTH, TABLE_THICKNESS, TABLE_DEPTH, 10, 0.075),
    new THREE.MeshStandardMaterial({
      color: '#b89167',
      map: woodDiffuse,
      normalMap: woodNormal,
      normalScale: new THREE.Vector2(0.12, 0.12),
      roughness: 0.84,
      metalness: 0,
    }),
  )
  tabletop.position.set(0, TABLE_SURFACE_Y - TABLE_THICKNESS / 2, -0.05)
  tabletop.castShadow = true
  tabletop.receiveShadow = true
  table.add(tabletop)

  const edge = new THREE.Mesh(
    new RoundedBoxGeometry(TABLE_WIDTH + 0.02, 0.045, TABLE_DEPTH + 0.02, 8, 0.035),
    new THREE.MeshStandardMaterial({
      color: '#8f6b45',
      roughness: 0.68,
      metalness: 0,
    }),
  )
  edge.position.set(0, TABLE_SURFACE_Y - TABLE_THICKNESS - 0.02, -0.05)
  edge.castShadow = true
  edge.receiveShadow = true
  table.add(edge)

  const legMaterial = new THREE.MeshStandardMaterial({
    color: '#22211f',
    metalness: 0.75,
    roughness: 0.34,
  })
  const legGeometry = new THREE.CylinderGeometry(0.032, 0.045, TABLE_SURFACE_Y - TABLE_THICKNESS, 18)
  const legY = (TABLE_SURFACE_Y - TABLE_THICKNESS) / 2
  const legPositions = [
    [-TABLE_WIDTH / 2 + 0.42, legY, -TABLE_DEPTH / 2 + 0.38],
    [TABLE_WIDTH / 2 - 0.42, legY, -TABLE_DEPTH / 2 + 0.38],
    [-TABLE_WIDTH / 2 + 0.42, legY, TABLE_DEPTH / 2 - 0.38],
    [TABLE_WIDTH / 2 - 0.42, legY, TABLE_DEPTH / 2 - 0.38],
  ]

  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry.clone(), legMaterial.clone())
    leg.position.set(x, y, z)
    leg.castShadow = true
    leg.receiveShadow = true
    table.add(leg)
  })

  return table
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
    angle: 1.24,
    radius: 4.35,
    height: 1.86,
    targetX: 0.16,
    targetY: 1.16,
    targetZ: -0.28,
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
        radius: 2.42,
        height: 1.76,
        targetX: 0.18,
        targetY: 1.45,
        targetZ: -1.08,
        duration: 3.7,
        ease: 'power3.inOut',
      })
      .to(
        orbit,
        {
          angle: 0.035,
          radius: 1.78,
          height: 1.58,
          targetY: 1.47,
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
    scene.background = new THREE.Color('#f0ece5')
    const orbitState = orbitRef.current
    const loadedRoots: THREE.Object3D[] = []
    const loader = new GLTFLoader()
    const textureLoader = new THREE.TextureLoader()
    const hdrLoader = new HDRLoader()
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
    renderer.toneMappingExposure = 1.22
    stage.appendChild(renderer.domElement)
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    let environmentTexture: THREE.Texture | null = null

    const isPortrait = stage.clientWidth < MOBILE_BREAKPOINT
    const camera = new THREE.PerspectiveCamera(
      isPortrait ? MOBILE_FOV : DESKTOP_FOV,
      stage.clientWidth / stage.clientHeight,
      0.1,
      100,
    )

    const ambient = new THREE.HemisphereLight('#fff9ee', '#c9c1b4', 1.18)
    scene.add(ambient)

    const key = new THREE.DirectionalLight('#fff4df', 4.45)
    key.position.set(3.8, 5.8, 3.4)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -6
    key.shadow.camera.right = 6
    key.shadow.camera.top = 6
    key.shadow.camera.bottom = -6
    scene.add(key)

    const coolRim = new THREE.PointLight('#d8ecff', 1.15, 7)
    coolRim.position.set(-2.9, 2.3, -2.7)
    scene.add(coolRim)

    const warmStrip = new THREE.PointLight('#ffe4ba', 0.92, 6)
    warmStrip.position.set(2.2, 2.2, 2.6)
    scene.add(warmStrip)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshStandardMaterial({
        color: '#e8e0d4',
        roughness: 0.72,
        metalness: 0,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 7),
      new THREE.MeshStandardMaterial({
        color: '#f4eee5',
        roughness: 0.84,
        metalness: 0,
      }),
    )
    backWall.position.set(0, 3.5, -4.4)
    backWall.receiveShadow = true
    scene.add(backWall)

    const sideWall = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 7),
      new THREE.MeshStandardMaterial({
        color: '#ebe3d7',
        roughness: 0.86,
        metalness: 0,
      }),
    )
    sideWall.rotation.y = Math.PI / 2
    sideWall.position.set(-5.8, 3.5, 0)
    sideWall.receiveShadow = true
    scene.add(sideWall)

    const screenTexture = createScreenBootTexture()
    const table = createStudioTable(textureLoader)
    scene.add(table)
    loadedRoots.push(table)

    hdrLoader.load(
      STUDIO_HDR_URL,
      (texture) => {
        if (!running) {
          texture.dispose()
          return
        }
        environmentTexture = pmremGenerator.fromEquirectangular(texture).texture
        scene.environment = environmentTexture
        texture.dispose()
      },
      undefined,
      (error) => console.error('Studio HDR failed to load', error),
    )

    let running = true
    let frame = 0
    let pointerX = 0
    let pointerY = 0

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
        macbook.rotation.y = -0.06
        const macbookBaseY = TABLE_SURFACE_Y - rawBox.min.y * modelScale + 0.018
        macbook.position.set(0.22, macbookBaseY, -0.28)
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
      const viewportRadius = current.radius * (isNarrow ? (startedRef.current ? 1.12 : 1.26) : 1)
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
      if (environmentTexture) {
        environmentTexture.dispose()
      }
      pmremGenerator.dispose()
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
