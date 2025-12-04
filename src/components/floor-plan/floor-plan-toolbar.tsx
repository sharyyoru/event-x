"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAppStore } from "@/store/app-store"
import {
  MousePointer2,
  Square,
  Hand,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Save,
  Upload,
  Download,
  Trash2,
  Grid3X3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FloorPlanToolbarProps {
  onSave: () => void
  onUploadDXF: () => void
  onExport: () => void
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onDelete: () => void
  onToggleGrid: () => void
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  gridEnabled: boolean
}

export function FloorPlanToolbar({
  onSave,
  onUploadDXF,
  onExport,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onDelete,
  onToggleGrid,
  canUndo,
  canRedo,
  hasSelection,
  gridEnabled,
}: FloorPlanToolbarProps) {
  const { floorPlanTool, setFloorPlanTool } = useAppStore()

  const tools = [
    { id: "select" as const, icon: MousePointer2, label: "Select (V)" },
    { id: "rectangle" as const, icon: Square, label: "Draw Booth (R)" },
    { id: "pan" as const, icon: Hand, label: "Pan (Space)" },
  ]

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
        {/* Drawing Tools */}
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={floorPlanTool === tool.id ? "default" : "ghost"}
                size="icon"
                onClick={() => setFloorPlanTool(tool.id)}
                className={cn(
                  "h-8 w-8",
                  floorPlanTool === tool.id && "bg-primary text-primary-foreground"
                )}
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tool.label}</TooltipContent>
          </Tooltip>
        ))}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Zoom Controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onZoomIn} className="h-8 w-8">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onZoomOut} className="h-8 w-8">
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Undo/Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 w-8"
            >
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 w-8"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Grid Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={gridEnabled ? "default" : "ghost"}
              size="icon"
              onClick={onToggleGrid}
              className="h-8 w-8"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Grid</TooltipContent>
        </Tooltip>

        {/* Delete */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={!hasSelection}
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete Booth (Del)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* File Operations */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onUploadDXF} className="h-8 w-8">
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import DXF</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onExport} className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onSave} className="h-8 w-8">
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
