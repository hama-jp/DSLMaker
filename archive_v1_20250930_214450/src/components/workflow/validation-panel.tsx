import { Panel } from '@xyflow/react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ValidationResult } from '@/types/dify-workflow'
import { ReactNode } from 'react'

interface ValidationPanelProps {
  validationResult: ValidationResult | null
  icon: ReactNode | null
}

export function ValidationPanel({ validationResult, icon }: ValidationPanelProps) {
  if (!validationResult) return null
  const { errors, warnings } = validationResult

  if (errors.length === 0 && warnings.length === 0) {
    return null
  }

  return (
    <Panel position="top-right" className="bg-background/95 backdrop-blur border rounded-lg p-4 max-w-sm">
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        {icon}
        Validation Results
      </h3>

      {errors.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-destructive mb-1">Errors:</h4>
          <ul className="text-xs space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-destructive">
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <Alert className="mt-2 border-yellow-200 text-yellow-700">
          <AlertDescription className="text-xs space-y-1">
            {warnings.map((warning, index) => (
              <div key={index}>• {warning.message}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </Panel>
  )
}
