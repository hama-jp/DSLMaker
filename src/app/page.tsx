import { AppLayout } from "@/components/layout/app-layout"
import { WorkflowEditor } from "@/components/workflow/workflow-editor"

export default function Home() {
  return (
    <AppLayout>
      <WorkflowEditor />
    </AppLayout>
  )
}
