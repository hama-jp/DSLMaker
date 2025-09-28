import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createGraphSlice } from './slices/graph-slice'
import { createUISlice } from './slices/ui-slice'
import { createPreviewSlice } from './slices/preview-slice'
import { createIOSlice } from './slices/io-slice'
import { createValidationSlice } from './slices/validation-slice'
import { WorkflowStore } from './types'

export const useWorkflowStore = create<WorkflowStore>()(
  devtools(
    immer((...args) => ({
      ...createGraphSlice(...args),
      ...createUISlice(...args),
      ...createPreviewSlice(...args),
      ...createIOSlice(...args),
      ...createValidationSlice(...args),
    })),
    { name: 'workflow-store' },
  ),
)

export type { WorkflowStore } from './types'
