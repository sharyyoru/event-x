"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Stage, Layer, Rect, Line, Circle, Text, Group, Transformer } from "react-konva"
import type { KonvaEventObject } from "konva/lib/Node"
import type Konva from "konva"
import { useAppStore } from "@/store/app-store"
import type { Booth, BoothCoordinates, ParsedDXF, DXFEntity } from "@/types"

interface FloorPlanCanvasProps {
  width: number
  height: number
  dxfData?: ParsedDXF
  booths: Booth[]
  onBoothSelect: (booth: Booth | null) => void
  onBoothUpdate: (boothId: string, coordinates: BoothCoordinates) => void
  onBoothCreate: (coordinates: BoothCoordinates) => void
  selectedBoothId: string | null
  readOnly?: boolean
}

export function FloorPlanCanvas({
  width,
  height,
  dxfData,
  booths,
  onBoothSelect,
  onBoothUpdate,
  onBoothCreate,
  selectedBoothId,
  readOnly = false,
}: FloorPlanCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const { floorPlanTool } = useAppStore()
  
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [drawingRect, setDrawingRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [stageScale, setStageScale] = useState(1)

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return
    
    const stage = stageRef.current
    const selectedNode = stage.findOne(`#booth-${selectedBoothId}`)
    
    if (selectedNode && !readOnly) {
      transformerRef.current.nodes([selectedNode])
      transformerRef.current.getLayer()?.batchDraw()
    } else {
      transformerRef.current.nodes([])
    }
  }, [selectedBoothId, readOnly])

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return

    const scaleBy = 1.1
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    
    // Limit scale
    const clampedScale = Math.max(0.1, Math.min(5, newScale))
    
    setStageScale(clampedScale)
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    })
  }, [])

  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (readOnly) return
    
    const stage = stageRef.current
    if (!stage) return
    
    const pos = stage.getPointerPosition()
    if (!pos) return

    // Adjust for stage position and scale
    const adjustedPos = {
      x: (pos.x - stagePos.x) / stageScale,
      y: (pos.y - stagePos.y) / stageScale,
    }

    if (floorPlanTool === "rectangle") {
      setIsDrawing(true)
      setDrawStart(adjustedPos)
      setDrawingRect({ x: adjustedPos.x, y: adjustedPos.y, width: 0, height: 0 })
    } else if (floorPlanTool === "pan") {
      // Pan mode - handled by draggable stage
    } else if (floorPlanTool === "select") {
      // Check if clicked on empty space
      const clickedOnEmpty = e.target === e.target.getStage()
      if (clickedOnEmpty) {
        onBoothSelect(null)
      }
    }
  }, [floorPlanTool, onBoothSelect, readOnly, stagePos, stageScale])

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || !drawStart) return
    
    const stage = stageRef.current
    if (!stage) return
    
    const pos = stage.getPointerPosition()
    if (!pos) return

    const adjustedPos = {
      x: (pos.x - stagePos.x) / stageScale,
      y: (pos.y - stagePos.y) / stageScale,
    }

    setDrawingRect({
      x: Math.min(drawStart.x, adjustedPos.x),
      y: Math.min(drawStart.y, adjustedPos.y),
      width: Math.abs(adjustedPos.x - drawStart.x),
      height: Math.abs(adjustedPos.y - drawStart.y),
    })
  }, [isDrawing, drawStart, stagePos, stageScale])

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !drawingRect) return
    
    // Only create booth if rectangle is large enough
    if (drawingRect.width > 20 && drawingRect.height > 20) {
      onBoothCreate({
        x: drawingRect.x,
        y: drawingRect.y,
        width: drawingRect.width,
        height: drawingRect.height,
        rotation: 0,
      })
    }
    
    setIsDrawing(false)
    setDrawStart(null)
    setDrawingRect(null)
  }, [isDrawing, drawingRect, onBoothCreate])

  const handleBoothDragEnd = useCallback((e: KonvaEventObject<DragEvent>, booth: Booth) => {
    const node = e.target
    onBoothUpdate(booth.id, {
      ...(booth.coordinates as BoothCoordinates),
      x: node.x(),
      y: node.y(),
    })
  }, [onBoothUpdate])

  const handleTransformEnd = useCallback((e: KonvaEventObject<Event>, booth: Booth) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    
    // Reset scale and apply to width/height
    node.scaleX(1)
    node.scaleY(1)
    
    onBoothUpdate(booth.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
      rotation: node.rotation(),
    })
  }, [onBoothUpdate])

  const renderDXFEntities = () => {
    if (!dxfData) return null
    
    return dxfData.entities.map((entity, index) => {
      switch (entity.type) {
        case "line":
          if (!entity.vertices || entity.vertices.length < 2) return null
          return (
            <Line
              key={`dxf-${index}`}
              points={[
                entity.vertices[0].x,
                entity.vertices[0].y,
                entity.vertices[1].x,
                entity.vertices[1].y,
              ]}
              stroke="#666"
              strokeWidth={1}
            />
          )
        
        case "polyline":
          if (!entity.vertices) return null
          return (
            <Line
              key={`dxf-${index}`}
              points={entity.vertices.flatMap((v) => [v.x, v.y])}
              stroke="#666"
              strokeWidth={1}
              closed
            />
          )
        
        case "circle":
          if (!entity.center || !entity.radius) return null
          return (
            <Circle
              key={`dxf-${index}`}
              x={entity.center.x}
              y={entity.center.y}
              radius={entity.radius}
              stroke="#666"
              strokeWidth={1}
            />
          )
        
        case "text":
          if (!entity.position) return null
          return (
            <Text
              key={`dxf-${index}`}
              x={entity.position.x}
              y={entity.position.y}
              text={entity.text || ""}
              fontSize={12}
              fill="#666"
            />
          )
        
        default:
          return null
      }
    })
  }

  const getBoothColor = (status: string) => {
    switch (status) {
      case "available":
        return "#22c55e" // green
      case "reserved":
        return "#eab308" // yellow
      case "sold":
        return "#ef4444" // red
      case "blocked":
        return "#6b7280" // gray
      default:
        return "#3b82f6" // blue
    }
  }

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      draggable={floorPlanTool === "pan"}
      x={stagePos.x}
      y={stagePos.y}
      scaleX={stageScale}
      scaleY={stageScale}
      style={{ 
        background: "#f8fafc",
        cursor: floorPlanTool === "pan" ? "grab" : floorPlanTool === "rectangle" ? "crosshair" : "default",
      }}
    >
      {/* Background Grid */}
      <Layer>
        <Rect
          x={-10000}
          y={-10000}
          width={20000}
          height={20000}
          fill="#f8fafc"
        />
      </Layer>

      {/* DXF Layer */}
      <Layer>{renderDXFEntities()}</Layer>

      {/* Booths Layer */}
      <Layer>
        {booths.map((booth) => {
          const coords = booth.coordinates as BoothCoordinates
          const isSelected = booth.id === selectedBoothId
          
          return (
            <Group
              key={booth.id}
              id={`booth-${booth.id}`}
              x={coords.x}
              y={coords.y}
              width={coords.width}
              height={coords.height}
              rotation={coords.rotation}
              draggable={!readOnly && floorPlanTool === "select"}
              onClick={() => onBoothSelect(booth)}
              onDragEnd={(e) => handleBoothDragEnd(e, booth)}
              onTransformEnd={(e) => handleTransformEnd(e, booth)}
            >
              <Rect
                width={coords.width}
                height={coords.height}
                fill={booth.color || getBoothColor(booth.status)}
                opacity={0.7}
                stroke={isSelected ? "#000" : "#333"}
                strokeWidth={isSelected ? 2 : 1}
                cornerRadius={4}
              />
              <Text
                text={booth.label}
                x={0}
                y={0}
                width={coords.width}
                height={coords.height}
                align="center"
                verticalAlign="middle"
                fontSize={14}
                fontStyle="bold"
                fill="#fff"
              />
            </Group>
          )
        })}

        {/* Drawing Preview */}
        {isDrawing && drawingRect && (
          <Rect
            x={drawingRect.x}
            y={drawingRect.y}
            width={drawingRect.width}
            height={drawingRect.height}
            fill="#3b82f6"
            opacity={0.5}
            stroke="#1d4ed8"
            strokeWidth={2}
            dash={[5, 5]}
          />
        )}

        {/* Transformer */}
        {!readOnly && (
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit minimum size
              if (newBox.width < 20 || newBox.height < 20) {
                return oldBox
              }
              return newBox
            }}
          />
        )}
      </Layer>
    </Stage>
  )
}
