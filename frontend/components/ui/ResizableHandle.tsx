'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ResizableHandleProps {
  direction: 'horizontal' | 'vertical'
  onResize: (delta: number) => void
  className?: string
}

export function ResizableHandle({ direction, onResize, className }: ResizableHandleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const startPosRef = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY
  }, [direction])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY
      const delta = currentPos - startPosRef.current
      startPosRef.current = currentPos
      onResize(delta)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, direction, onResize])

  return (
    <div
      className={cn(
        'group relative flex-shrink-0 transition-colors',
        direction === 'horizontal'
          ? 'w-1 cursor-col-resize hover:bg-primary/20'
          : 'h-1 cursor-row-resize hover:bg-primary/20',
        isDragging && 'bg-primary/30',
        className
      )}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator */}
      <div
        className={cn(
          'absolute bg-primary/0 group-hover:bg-primary/40 transition-colors',
          direction === 'horizontal'
            ? 'inset-y-0 left-0 w-1'
            : 'inset-x-0 top-0 h-1',
          isDragging && 'bg-primary/60'
        )}
      />
    </div>
  )
}
