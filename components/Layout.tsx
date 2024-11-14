import { Sidebar } from "@/components/Sidebar"
import { Database, Home, Settings } from "lucide-react" // Import icons

export default function Layout({ children }: { children: React.ReactNode }) {
  const sidebarItems = [
    {
      title: "Home",
      icon: <Home className="h-4 w-4" />,
      description: "Return to homepage"
    },
    {
      title: "Database",
      icon: <Database className="h-4 w-4" />,
      description: "Manage your data"
    },
    {
      title: "Settings",
      icon: <Settings className="h-4 w-4" />,
      description: "Configure application"
    },
  ]

  return (
    <div className="flex h-screen">
      <div className="w-64 border-r bg-background">
        <Sidebar items={sidebarItems} className="w-full" />
      </div>
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
