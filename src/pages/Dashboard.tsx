import { Card } from '@/components/ui/card'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Tickets</h3>
          <p className="text-3xl font-bold text-primary">-</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Open Tickets</h3>
          <p className="text-3xl font-bold text-primary">-</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Team Mappings</h3>
          <p className="text-3xl font-bold text-primary">-</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Device Logs</h3>
          <p className="text-3xl font-bold text-primary">-</p>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <p className="text-muted-foreground">No recent activity to display.</p>
      </Card>
    </div>
  )
}