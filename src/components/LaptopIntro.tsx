import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type LaptopIntroProps = {
  onComplete: () => void
}

const DESK_URL = '/models/wooden-desk.glb'
const MACBOOK_URL = '/models/macbook-pro-m3.glb'
const MOBILE_BREAKPOINT = 640
const DESKTOP_FOV = 38
const MOBILE_FOV = 68
const TABLE_SURFACE_Y = 1.42
const CLOSED_LID_ROTATION = -0.5

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return
    }

    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => {
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
        material.envMapIntensity = 1.2
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
    gradient.addColorStop(0, '#0c1520')
    gradient.addColorStop(0.58, '#102c38')
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
      ctx.fillRect(44, y, 430 + Math.random() * 180, 2)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function LaptopIntro({ onComplete }: LaptopIntroProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const lidPivotRef = useRef<THREE.Group | null>(null)
  const orbitRef = useRef({ angle: 1.48, radius: 6.15, height: 2.85 })
  const [assetReady, setAssetReady] = useState(false)
  const [started, setStarted] = useState(false)

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
    renderer.toneMappingExposure = 1.1
    stage.appendChild(renderer.domElement)

    const isPortrait = stage.clientWidth < MOBILE_BREAKPOINT
    const camera = new THREE.PerspectiveCamera(
      isPortrait ? MOBILE_FOV : DESKTOP_FOV,
      stage.clientWidth / stage.clientHeight,
      0.1,
      100,
    )

    const ambient = new THREE.HemisphereLight('#f4f7fb', '#15100d', 1.45)
    scene.add(ambient)

    const key = new THREE.DirectionalLight('#fff3dc', 3.1)
    key.position.set(3.8, 5.8, 4.5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -5
    key.shadow.camera.right = 5
    key.shadow.camera.top = 5
    key.shadow.camera.bottom = -5
    scene.add(key)

    const coolRim = new THREE.PointLight('#8fd2ff', 2.25, 9)
    coolRim.position.set(-3.7, 3.2, -2.8)
    scene.add(coolRim)

    const warmStrip = new THREE.PointLight('#ffe0b0', 1.7, 7)
    warmStrip.position.set(2.1, 2.5, 2.6)
    scene.add(warmStrip)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
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
      new THREE.PlaneGeometry(24, 8),
      new THREE.MeshStandardMaterial({
        color: '#090d10',
        roughness: 0.86,
        metalness: 0.02,
      }),
    )
    backWall.position.set(0, 4, -5.2)
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
        const frontChairNames = ['Chair', 'Chair001']
        frontChairNames.forEach((name) => {
          const chair = desk.getObjectByName(name)
          if (chair) {
            chair.visible = false
          }
        })
        const rearChair = desk.getObjectByName('Chair002')
        if (rearChair) {
          rearChair.scale.setScalar(0.55)
          rearChair.position.x -= 2.55
          rearChair.position.z -= 1.1
        }
        desk.scale.setScalar(0.62)
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
        macbook.name = 'MacBook Pro M3 16 inch'
        macbook.updateMatrixWorld(true)

        const rawBox = new THREE.Box3().setFromObject(macbook)
        const rawSize = new THREE.Vector3()
        rawBox.getSize(rawSize)
        const modelScale = 2.55 / rawSize.x

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

        const screenPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(26.1, 15.1),
          new THREE.MeshBasicMaterial({
            map: screenTexture,
            toneMapped: false,
          }),
        )
        screenPlane.name = 'Kacper desktop boot screen'
        screenPlane.position.set(0, 11.02, -16.12)
        screenPlane.rotation.x = -0.36
        screenPlane.rotation.y = Math.PI
        lidPivot.add(screenPlane)

        macbook.scale.setScalar(modelScale)
        macbook.rotation.y = -0.1
        const macbookBaseY = TABLE_SURFACE_Y - rawBox.min.y * modelScale + 0.035
        macbook.position.set(0, macbookBaseY, -0.26)
        macbook.userData.baseY = macbookBaseY
        scene.add(macbook)
        loadedRoots.push(macbook)
        setAssetReady(true)
      },
      undefined,
      (error) => console.error('MacBook model failed to load', error),
    )

    function updateCameraFromOrbit() {
      const current = orbitRef.current
      const isNarrow = window.innerWidth < MOBILE_BREAKPOINT
      const viewportRadius = current.radius * (isNarrow ? 1.34 : 1)
      const target = new THREE.Vector3(isNarrow ? 0.24 : 0.08, 1.78, -0.34)

      camera.position.set(
        Math.sin(current.angle) * viewportRadius + pointerX * 0.12,
        current.height + pointerY * 0.08,
        Math.cos(current.angle) * viewportRadius,
      )
      camera.lookAt(target)
    }

    function animate() {
      if (!running) {
        return
      }

      frame += 1
      loadedRoots.forEach((root) => {
        if (root.name === 'MacBook Pro M3 16 inch') {
          root.position.y = root.userData.baseY + Math.sin(frame * 0.015) * 0.003
        }
      })
      updateCameraFromOrbit()
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
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('pointermove', handlePointerMove)
    animate()

    return () => {
      running = false
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', handlePointerMove)
      gsap.killTweensOf(orbitState)
      if (lidPivotRef.current) {
        gsap.killTweensOf(lidPivotRef.current.rotation)
      }
      loadedRoots.forEach(disposeObject)
      screenTexture.dispose()
      renderer.dispose()
      stage.removeChild(renderer.domElement)
    }
  }, [])

  function enterWorkspace() {
    if (started || !assetReady) {
      return
    }
    setStarted(true)

    const orbit = orbitRef.current
    const lidPivot = lidPivotRef.current

    if (lidPivot) {
      gsap.to(lidPivot.rotation, {
        x: -0.06,
        duration: 3.15,
        ease: 'power3.inOut',
      })
    }

    gsap
      .timeline({
        onComplete,
      })
      .to(orbit, {
        angle: 0.08,
        radius: 3.25,
        height: 1.95,
        duration: 3.25,
        ease: 'power3.inOut',
      })
      .to(
        orbit,
        {
          radius: 2.34,
          height: 1.62,
          duration: 0.82,
          ease: 'power2.inOut',
        },
        '-=0.72',
      )
  }

  return (
    <section className="intro-scene" aria-label="MacBook 3D intro">
      <div ref={mountRef} className="three-stage" aria-hidden="true"></div>
      <button
        className="intro-hotspot"
        type="button"
        onClick={enterWorkspace}
        disabled={!assetReady || started}
      >
        <span>{!assetReady ? 'Loading model' : started ? 'Opening workspace' : 'Enter workspace'}</span>
      </button>
      <div className="intro-caption">
        <p>MacBook Pro M3 / wooden desk / smooth orbit boot</p>
      </div>
    </section>
  )
}
