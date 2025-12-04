import DxfParser from 'dxf-parser'
import type { ParsedDXF, DXFEntity } from '@/types'

export interface DXFBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export function parseDXFFile(content: string): ParsedDXF {
  const parser = new DxfParser()
  const dxf = parser.parseSync(content)

  if (!dxf || !dxf.entities) {
    throw new Error('Invalid DXF file')
  }

  const entities: DXFEntity[] = []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const entity of dxf.entities) {
    const parsedEntity = parseEntity(entity)
    if (parsedEntity) {
      entities.push(parsedEntity)
      
      // Update bounds
      if (parsedEntity.vertices) {
        for (const vertex of parsedEntity.vertices) {
          minX = Math.min(minX, vertex.x)
          minY = Math.min(minY, vertex.y)
          maxX = Math.max(maxX, vertex.x)
          maxY = Math.max(maxY, vertex.y)
        }
      }
      if (parsedEntity.center && parsedEntity.radius) {
        minX = Math.min(minX, parsedEntity.center.x - parsedEntity.radius)
        minY = Math.min(minY, parsedEntity.center.y - parsedEntity.radius)
        maxX = Math.max(maxX, parsedEntity.center.x + parsedEntity.radius)
        maxY = Math.max(maxY, parsedEntity.center.y + parsedEntity.radius)
      }
      if (parsedEntity.position) {
        minX = Math.min(minX, parsedEntity.position.x)
        minY = Math.min(minY, parsedEntity.position.y)
        maxX = Math.max(maxX, parsedEntity.position.x)
        maxY = Math.max(maxY, parsedEntity.position.y)
      }
    }
  }

  // Handle case where no valid entities found
  if (minX === Infinity) {
    minX = 0
    minY = 0
    maxX = 1000
    maxY = 1000
  }

  return {
    entities,
    bounds: { minX, minY, maxX, maxY },
  }
}

function parseEntity(entity: any): DXFEntity | null {
  switch (entity.type) {
    case 'LINE':
      return {
        type: 'line',
        vertices: [
          { x: entity.vertices[0].x, y: entity.vertices[0].y },
          { x: entity.vertices[1].x, y: entity.vertices[1].y },
        ],
      }
    
    case 'LWPOLYLINE':
    case 'POLYLINE':
      return {
        type: 'polyline',
        vertices: entity.vertices.map((v: any) => ({ x: v.x, y: v.y })),
      }
    
    case 'CIRCLE':
      return {
        type: 'circle',
        center: { x: entity.center.x, y: entity.center.y },
        radius: entity.radius,
      }
    
    case 'ARC':
      return {
        type: 'arc',
        center: { x: entity.center.x, y: entity.center.y },
        radius: entity.radius,
        startAngle: entity.startAngle,
        endAngle: entity.endAngle,
      }
    
    case 'TEXT':
    case 'MTEXT':
      return {
        type: 'text',
        position: { x: entity.startPoint?.x || 0, y: entity.startPoint?.y || 0 },
        text: entity.text || '',
      }
    
    case 'INSERT':
      // Block reference - simplified handling
      return {
        type: 'insert',
        position: { x: entity.position?.x || 0, y: entity.position?.y || 0 },
      }
    
    default:
      return null
  }
}

export function calculateScaleRatio(
  bounds: DXFBounds,
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 50
): number {
  const availableWidth = canvasWidth - padding * 2
  const availableHeight = canvasHeight - padding * 2
  
  const scaleX = availableWidth / bounds.width
  const scaleY = availableHeight / bounds.height
  
  return Math.min(scaleX, scaleY)
}

export function transformCoordinates(
  x: number,
  y: number,
  bounds: DXFBounds,
  scale: number,
  canvasHeight: number,
  offsetX: number = 0,
  offsetY: number = 0
): { x: number; y: number } {
  // Translate to origin, scale, and flip Y axis (CAD uses bottom-left origin)
  return {
    x: (x - bounds.minX) * scale + offsetX,
    y: canvasHeight - (y - bounds.minY) * scale - offsetY,
  }
}
