"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartData {
  labels: string[]
  values: number[]
  colors?: string[]
}

interface AnalyticsChartProps {
  title: string
  description?: string
  data: ChartData
  type: "bar" | "line" | "pie"
  height?: number
}

export default function AnalyticsChart({ title, description, data, type, height = 300 }: AnalyticsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Clear previous drawings
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    const width = canvasRef.current.width
    const chartHeight = canvasRef.current.height - 40 // Leave space for labels
    const barWidth = width / (data.labels.length * 2)
    const maxValue = Math.max(...data.values)

    // Default colors if not provided
    const colors = data.colors || [
      "#10b981", // green-500
      "#3b82f6", // blue-500
      "#ef4444", // red-500
      "#f59e0b", // amber-500
      "#8b5cf6", // violet-500
    ]

    if (type === "bar") {
      // Draw bar chart
      data.labels.forEach((label, index) => {
        const x = index * (width / data.labels.length) + width / (data.labels.length * 2) - barWidth / 2
        const barHeight = (data.values[index] / maxValue) * chartHeight
        const y = chartHeight - barHeight

        // Draw bar
        ctx.fillStyle = colors[index % colors.length]
        ctx.fillRect(x, y, barWidth, barHeight)

        // Draw label
        ctx.fillStyle = "#6b7280" // text-gray-500
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(label, x + barWidth / 2, chartHeight + 20)

        // Draw value
        ctx.fillStyle = "#1f2937" // text-gray-800
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(data.values[index].toString(), x + barWidth / 2, y - 5)
      })
    } else if (type === "pie") {
      // Draw pie chart
      const centerX = width / 2
      const centerY = chartHeight / 2
      const radius = Math.min(centerX, centerY) - 10
      let startAngle = 0

      const total = data.values.reduce((sum, value) => sum + value, 0)

      // Draw pie slices
      data.values.forEach((value, index) => {
        const sliceAngle = (2 * Math.PI * value) / total

        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
        ctx.closePath()

        ctx.fillStyle = colors[index % colors.length]
        ctx.fill()

        // Draw label line and text
        const midAngle = startAngle + sliceAngle / 2
        const labelRadius = radius * 1.2
        const labelX = centerX + Math.cos(midAngle) * labelRadius
        const labelY = centerY + Math.sin(midAngle) * labelRadius

        ctx.beginPath()
        ctx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius)
        ctx.lineTo(labelX, labelY)
        ctx.strokeStyle = colors[index % colors.length]
        ctx.stroke()

        ctx.fillStyle = "#1f2937" // text-gray-800
        ctx.font = "10px sans-serif"
        ctx.textAlign = midAngle < Math.PI ? "left" : "right"
        ctx.fillText(
          `${data.labels[index]} (${Math.round((value / total) * 100)}%)`,
          midAngle < Math.PI ? labelX + 5 : labelX - 5,
          labelY,
        )

        startAngle += sliceAngle
      })
    } else if (type === "line") {
      // Draw line chart
      ctx.beginPath()
      ctx.strokeStyle = colors[0]
      ctx.lineWidth = 2

      const gap = width / (data.labels.length - 1)

      data.values.forEach((value, index) => {
        const x = index * gap
        const y = chartHeight - (value / maxValue) * chartHeight

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        // Draw points
        ctx.fillStyle = colors[0]
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()

        // Draw labels
        ctx.fillStyle = "#6b7280" // text-gray-500
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(data.labels[index], x, chartHeight + 20)

        // Draw values
        ctx.fillStyle = "#1f2937" // text-gray-800
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(data.values[index].toString(), x, y - 10)
      })

      ctx.stroke()
    }
  }, [data, type])

  return (
    <Card className="dark:border-gray-800">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <canvas ref={canvasRef} width="600" height={height} className="w-full"></canvas>
        </div>
      </CardContent>
    </Card>
  )
}
