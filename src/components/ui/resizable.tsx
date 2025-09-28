"use client"

import * as React from "react"

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  children: React.ReactNode
}

export function ResizablePanel({
  defaultWidth = 320,
  minWidth = 200,
  maxWidth = 600,
  children,
  className,
  ...props
}: ResizablePanelProps) {
  const [width, setWidth] = React.useState(defaultWidth)
  const [isResizing, setIsResizing] = React.useState(false)
  const resizeRef = React.useRef<HTMLDivElement>(null)

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return

      const rect = resizeRef.current.getBoundingClientRect()
      const newWidth = e.clientX - rect.left

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, minWidth, maxWidth])

  return (
    <div
      ref={resizeRef}
      className={`relative ${className}`}
      style={{ width }}
      {...props}
    >
      {children}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-border hover:bg-border/80 transition-colors"
        onMouseDown={handleMouseDown}
      />
      {isResizing && (
        <div className="fixed inset-0 cursor-col-resize" style={{ zIndex: 9999 }} />
      )}
    </div>
  )
}