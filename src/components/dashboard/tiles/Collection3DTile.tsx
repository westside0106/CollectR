/* eslint-disable react/no-unknown-property */
'use client'

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { createClient } from '@/lib/supabase/client'

// ============================================
// Typen
// ============================================

interface CollectionNode {
  id: string
  name: string
  itemCount: number
  totalValue: number
  color: string
  position: THREE.Vector3
}

interface Collection3DData {
  nodes: CollectionNode[]
  loading: boolean
}

// ============================================
// Farb-Palette (passend zum Collectorssphere Design)
// ============================================

const NODE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#A855F7', // Purple
]

// ============================================
// Vertex & Fragment Shader fuer Glow-Effekt
// ============================================

const glowVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const glowFragmentShader = `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uHover;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Fresnel-basierter Glow
  vec3 viewDir = normalize(-vPosition);
  float fresnel = 1.0 - dot(viewDir, vNormal);
  fresnel = pow(fresnel, 2.0);

  // Kern-Farbe + Glow
  float coreAlpha = 0.85 + uHover * 0.15;
  vec3 core = uColor * coreAlpha;
  vec3 glow = uColor * fresnel * (uIntensity + uHover * 0.6);

  float alpha = max(coreAlpha * 0.9, fresnel * (0.7 + uHover * 0.3));
  gl_FragColor = vec4(core + glow, alpha);
}
`

// ============================================
// Einzelner Node (Collection-Kugel)
// ============================================

interface NodeProps {
  node: CollectionNode
  onHover: (node: CollectionNode | null) => void
  hoveredId: string | null
}

function CollectionNodeMesh({ node, onHover, hoveredId }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const isHovered = hoveredId === node.id
  const targetScale = useRef(1)
  const currentScale = useRef(1)

  // Node-Groesse basierend auf Item-Count (min 0.15, max 0.6)
  const baseSize = useMemo(() => {
    return Math.max(0.15, Math.min(0.6, 0.1 + node.itemCount * 0.008))
  }, [node.itemCount])

  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return

    // Hover-Animation
    targetScale.current = isHovered ? 1.4 : 1
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale.current, delta * 8)
    const s = baseSize * currentScale.current
    meshRef.current.scale.setScalar(s)

    // Shader Hover-Intensity
    materialRef.current.uniforms.uHover.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uHover.value,
      isHovered ? 1.0 : 0.0,
      delta * 8
    )

    // Leichtes Pulsieren
    const pulse = 1.0 + Math.sin(Date.now() * 0.003 + node.position.x * 10) * 0.03
    meshRef.current.scale.multiplyScalar(pulse)
  })

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onHover(node)
    document.body.style.cursor = 'pointer'
  }, [node, onHover])

  const handlePointerOut = useCallback(() => {
    onHover(null)
    document.body.style.cursor = 'auto'
  }, [onHover])

  return (
    <mesh
      ref={meshRef}
      position={node.position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={glowVertexShader}
        fragmentShader={glowFragmentShader}
        transparent
        depthWrite={false}
        uniforms={{
          uColor: { value: new THREE.Color(node.color) },
          uIntensity: { value: 0.8 },
          uHover: { value: 0.0 },
        }}
      />
    </mesh>
  )
}

// ============================================
// Verbindungslinien zwischen Nodes
// ============================================

function ConnectionLines({ nodes, hoveredId }: { nodes: CollectionNode[]; hoveredId: string | null }) {
  const linesRef = useRef<THREE.Group>(null)

  const lines = useMemo(() => {
    if (nodes.length < 2) return []
    const result: { from: THREE.Vector3; to: THREE.Vector3; opacity: number }[] = []

    // Jeder Node mit jedem anderen verbunden (mit Distanz-basierter Opacity)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].position.distanceTo(nodes[j].position)
        const maxDist = 4.5
        if (dist < maxDist) {
          result.push({
            from: nodes[i].position,
            to: nodes[j].position,
            opacity: Math.max(0.05, 1 - dist / maxDist) * 0.35,
          })
        }
      }
    }
    return result
  }, [nodes])

  useFrame((_, delta) => {
    if (!linesRef.current) return
    linesRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Line) {
        const mat = child.material as THREE.LineBasicMaterial
        const line = lines[i]
        if (!line) return

        // Hovered Node hebt verbundene Linien hervor
        const isConnectedToHovered = hoveredId && (
          nodes.find(n => n.id === hoveredId)?.position.equals(line.from) ||
          nodes.find(n => n.id === hoveredId)?.position.equals(line.to)
        )

        const targetOpacity = isConnectedToHovered ? 0.6 : (hoveredId ? 0.05 : line.opacity)
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 6)
      }
    })
  })

  return (
    <group ref={linesRef}>
      {lines.map((line, i) => {
        const points = [line.from, line.to]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        return (
          <line key={i} geometry={geometry}>
            <lineBasicMaterial
              color="#4B9FFF"
              transparent
              opacity={line.opacity}
              depthWrite={false}
            />
          </line>
        )
      })}
    </group>
  )
}

// ============================================
// Hintergrund-Partikel (Sternenfeld-Effekt)
// ============================================

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)

  const [positions, sizes] = useMemo(() => {
    const count = 500
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
      sz[i] = Math.random() * 2 + 0.5
    }
    return [pos, sz]
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.015
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#6B7280"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ============================================
// Orbit Controls (manuell, ohne drei)
// ============================================

function CameraController() {
  const { camera, gl } = useThree()
  const isDragging = useRef(false)
  const previousMouse = useRef({ x: 0, y: 0 })
  const spherical = useRef(new THREE.Spherical(6, Math.PI / 2.2, 0))
  const targetSpherical = useRef(new THREE.Spherical(6, Math.PI / 2.2, 0))
  const autoRotate = useRef(true)
  const lastInteraction = useRef(0)

  useEffect(() => {
    const canvas = gl.domElement

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true
      previousMouse.current = { x: e.clientX, y: e.clientY }
      autoRotate.current = false
      lastInteraction.current = Date.now()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - previousMouse.current.x
      const dy = e.clientY - previousMouse.current.y
      previousMouse.current = { x: e.clientX, y: e.clientY }

      targetSpherical.current.theta -= dx * 0.008
      targetSpherical.current.phi = THREE.MathUtils.clamp(
        targetSpherical.current.phi - dy * 0.008,
        0.3,
        Math.PI - 0.3
      )
    }

    const onPointerUp = () => {
      isDragging.current = false
      lastInteraction.current = Date.now()
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      targetSpherical.current.radius = THREE.MathUtils.clamp(
        targetSpherical.current.radius + e.deltaY * 0.005,
        3,
        12
      )
      autoRotate.current = false
      lastInteraction.current = Date.now()
    }

    // Touch-Support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true
        previousMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        autoRotate.current = false
        lastInteraction.current = Date.now()
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return
      e.preventDefault()
      const dx = e.touches[0].clientX - previousMouse.current.x
      const dy = e.touches[0].clientY - previousMouse.current.y
      previousMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }

      targetSpherical.current.theta -= dx * 0.008
      targetSpherical.current.phi = THREE.MathUtils.clamp(
        targetSpherical.current.phi - dy * 0.008,
        0.3,
        Math.PI - 0.3
      )
    }

    const onTouchEnd = () => {
      isDragging.current = false
      lastInteraction.current = Date.now()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [gl])

  useFrame((_, delta) => {
    // Auto-Rotation nach 4 Sekunden Inaktivitaet
    if (!isDragging.current && Date.now() - lastInteraction.current > 4000) {
      autoRotate.current = true
    }

    if (autoRotate.current) {
      targetSpherical.current.theta += delta * 0.15
    }

    // Smooth interpolation
    spherical.current.theta = THREE.MathUtils.lerp(spherical.current.theta, targetSpherical.current.theta, delta * 4)
    spherical.current.phi = THREE.MathUtils.lerp(spherical.current.phi, targetSpherical.current.phi, delta * 4)
    spherical.current.radius = THREE.MathUtils.lerp(spherical.current.radius, targetSpherical.current.radius, delta * 4)

    const pos = new THREE.Vector3().setFromSpherical(spherical.current)
    camera.position.copy(pos)
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ============================================
// Hover-Label (HTML Overlay)
// ============================================

function HoverLabel({ node, mousePos }: { node: CollectionNode | null; mousePos: { x: number; y: number } }) {
  if (!node) return null

  return (
    <div
      className="absolute pointer-events-none z-10 transition-opacity duration-200"
      style={{
        left: mousePos.x + 16,
        top: mousePos.y - 10,
        opacity: node ? 1 : 0,
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-600/50 rounded-lg px-3 py-2 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full shadow-lg"
            style={{ backgroundColor: node.color, boxShadow: `0 0 8px ${node.color}` }}
          />
          <span className="text-white font-semibold text-sm">{node.name}</span>
        </div>
        <div className="text-slate-400 text-xs space-y-0.5">
          <div>{node.itemCount} Items</div>
          {node.totalValue > 0 && (
            <div className="text-emerald-400">{node.totalValue.toFixed(2)} EUR</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// 3D Scene
// ============================================

interface SceneProps {
  nodes: CollectionNode[]
  onHover: (node: CollectionNode | null) => void
  hoveredId: string | null
}

function Scene({ nodes, onHover, hoveredId }: SceneProps) {
  return (
    <>
      <CameraController />
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.4} color="#3B82F6" />
      <pointLight position={[-5, -3, -5]} intensity={0.2} color="#8B5CF6" />

      <ParticleField />
      <ConnectionLines nodes={nodes} hoveredId={hoveredId} />

      {nodes.map((node) => (
        <CollectionNodeMesh
          key={node.id}
          node={node}
          onHover={onHover}
          hoveredId={hoveredId}
        />
      ))}
    </>
  )
}

// ============================================
// Daten laden
// ============================================

function useCollectionGraphData(): Collection3DData {
  const [nodes, setNodes] = useState<CollectionNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Sammlungen mit Item-Counts laden
      const { data: collections } = await supabase
        .from('collections')
        .select('id, name')
        .eq('owner_id', user.id)

      if (!collections || collections.length === 0) {
        setLoading(false)
        return
      }

      // Items pro Sammlung (Count + Wert)
      const collectionNodes: CollectionNode[] = []

      for (let i = 0; i < collections.length; i++) {
        const col = collections[i]

        const { count } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', col.id)

        const { data: valueData } = await supabase
          .from('items')
          .select('purchase_price')
          .eq('collection_id', col.id)

        const totalValue = (valueData || []).reduce((sum, item) =>
          sum + (item.purchase_price || 0), 0
        )

        // Positionen auf einer Kugel verteilen (Fibonacci Sphere)
        const phi = Math.acos(1 - 2 * (i + 0.5) / collections.length)
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5)
        const radius = 2.0 + Math.random() * 0.8

        collectionNodes.push({
          id: col.id,
          name: col.name,
          itemCount: count || 0,
          totalValue,
          color: NODE_COLORS[i % NODE_COLORS.length],
          position: new THREE.Vector3(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
          ),
        })
      }

      setNodes(collectionNodes)
      setLoading(false)
    }

    load()
  }, [])

  return { nodes, loading }
}

// ============================================
// Hauptkomponente
// ============================================

export function Collection3DTile() {
  const { nodes, loading } = useCollectionGraphData()
  const [hoveredNode, setHoveredNode] = useState<CollectionNode | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  if (loading) {
    return (
      <div className="h-72 sm:h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Graph wird geladen...</p>
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="h-72 sm:h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🧊</div>
          <p className="text-sm text-slate-400">Erstelle Sammlungen, um deinen 3D-Graph zu sehen</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative h-72 sm:h-80 rounded-xl overflow-hidden bg-slate-950"
      onMouseMove={handleMouseMove}
    >
      {/* Stats Overlay oben links */}
      <div className="absolute top-3 left-3 z-10">
        <div className="text-[10px] font-mono text-slate-500 space-y-0.5">
          <div>{nodes.length} Sammlungen</div>
          <div>{nodes.reduce((s, n) => s + n.itemCount, 0)} Items</div>
          <div>{nodes.reduce((s, n) => s + n.totalValue, 0).toFixed(0)} EUR</div>
        </div>
      </div>

      {/* Interaktions-Hinweis unten */}
      <div className="absolute bottom-3 left-0 right-0 z-10 text-center">
        <span className="text-[10px] text-slate-600">
          Ziehen zum Drehen &middot; Scrollen zum Zoomen
        </span>
      </div>

      {/* Hover Label */}
      <HoverLabel node={hoveredNode} mousePos={mousePos} />

      {/* 3D Canvas */}
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 100 }}
        style={{ background: 'transparent' }}
      >
        <Scene
          nodes={nodes}
          onHover={setHoveredNode}
          hoveredId={hoveredNode?.id ?? null}
        />
      </Canvas>
    </div>
  )
}
