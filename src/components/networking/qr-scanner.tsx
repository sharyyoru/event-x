"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, CameraOff, CheckCircle, XCircle } from "lucide-react"
import { parseQRCodeData } from "@/lib/utils"

interface QRScannerProps {
  onScan: (data: { userId: string; eventId: string }) => void
  eventId: string
}

export function QRScanner({ onScan, eventId }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let animationFrame: number

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setHasPermission(true)
        }
      } catch (error) {
        console.error("Camera access denied:", error)
        setHasPermission(false)
      }
    }

    const scan = () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrame = requestAnimationFrame(scan)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // In a real implementation, you would use a QR code detection library
      // like @aspect-ratio/qr-scanner or jsQR here
      // For now, we'll simulate the scanning process

      animationFrame = requestAnimationFrame(scan)
    }

    if (isScanning) {
      startCamera()
      animationFrame = requestAnimationFrame(scan)
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isScanning])

  const handleStartScanning = () => {
    setIsScanning(true)
    setLastResult(null)
  }

  const handleStopScanning = () => {
    setIsScanning(false)
  }

  // Simulated QR scan for demo purposes
  const handleSimulatedScan = () => {
    const mockData = JSON.stringify({
      type: "eventx_badge",
      userId: "user-123",
      eventId: eventId,
      timestamp: Date.now(),
    })

    const parsed = parseQRCodeData(mockData)
    if (parsed && parsed.eventId === eventId) {
      setLastResult({ success: true, message: "Successfully scanned!" })
      onScan(parsed)
    } else {
      setLastResult({ success: false, message: "Invalid QR code" })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Scanner View */}
          <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-lg bg-muted">
            {isScanning ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 rounded-lg border-4 border-primary opacity-50" />
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <CameraOff className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Camera is off
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Permission status */}
          {hasPermission === false && (
            <p className="text-sm text-destructive">
              Camera access denied. Please enable camera permissions.
            </p>
          )}

          {/* Last result */}
          {lastResult && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 ${
                lastResult.success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{lastResult.message}</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            {isScanning ? (
              <Button
                variant="outline"
                onClick={handleStopScanning}
                className="flex-1"
              >
                <CameraOff className="mr-2 h-4 w-4" />
                Stop Scanning
              </Button>
            ) : (
              <Button onClick={handleStartScanning} className="flex-1">
                <Camera className="mr-2 h-4 w-4" />
                Start Scanning
              </Button>
            )}
          </div>

          {/* Demo button */}
          <Button
            variant="secondary"
            onClick={handleSimulatedScan}
            className="w-full"
          >
            Simulate Scan (Demo)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
