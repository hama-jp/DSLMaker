import { AppLayout } from "@/components/layout/app-layout"
import { WorkflowEditor } from "@/components/workflow/workflow-editor"
import { ReactFlowProvider } from "@xyflow/react"

export default function Home() {
  return (
    <ReactFlowProvider>
      <AppLayout>
        <WorkflowEditor />
      </AppLayout>
    </ReactFlowProvider>
  )
}
