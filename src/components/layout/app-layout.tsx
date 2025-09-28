"use client"

import { ReactNode } from "react"
import { Header } from "./header"
import { LeftSidebar } from "./left-sidebar"
import { ChatSidebar } from "./chat-sidebar"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
        <ChatSidebar />
      </div>
    </div>
  )
}