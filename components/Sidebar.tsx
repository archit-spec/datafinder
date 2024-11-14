import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    title: string
    description?: string
    icon?: React.ReactNode
  }[]
}

export function Sidebar({ className, items, ...props }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Dashboard</h2>
          <ScrollArea className="h-[calc(100vh-10rem)] px-1">
            <div className="space-y-2">
              {items.map((item, index) => (
                <Card key={index} className="hover:bg-accent transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-x-4">
                      {item.icon && <div className="text-xl">{item.icon}</div>}
                      <div>
                        <CardTitle className="text-sm font-medium leading-none">
                          {item.title}
                        </CardTitle>
                        {item.description && (
                          <CardDescription className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}