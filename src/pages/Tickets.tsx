import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Ticket } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, ExternalLink, RefreshCw, X, Eye } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`ticket_title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,reporter.ilike.%${searchTerm}%`)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter)
      }

      const { data, error } = await query
      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchTickets()
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, statusFilter, priorityFilter])

  const getStatusBadge = (status: string) => {
    const colors = {
      'Open': 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Closed': 'bg-gray-100 text-gray-800',
      'On Hold': 'bg-yellow-100 text-yellow-800'
    }
    return colors[status as keyof typeof colors] || colors.Open
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'High': 'bg-red-100 text-red-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-green-100 text-green-800'
    }
    return colors[priority as keyof typeof colors] || colors.Medium
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Tickets from Monday.com</h2>
        <Button onClick={fetchTickets}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No tickets found. Tickets will appear here when created via Monday.com webhook.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium max-w-xs">
                    <div className="truncate" title={ticket.ticket_title}>
                      {ticket.ticket_title}
                    </div>
                    {ticket.description && (
                      <div className="text-sm text-muted-foreground truncate" title={ticket.description}>
                        {ticket.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{ticket.ticket_type || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </TableCell>
                  <TableCell>{ticket.team_assigned || '-'}</TableCell>
                  <TableCell>{ticket.reporter || '-'}</TableCell>
                  <TableCell>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTicket(ticket)
                          setShowDetails(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {ticket.monday_board_id && ticket.monday_item_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://digitalsarthi-company.monday.com/boards/${ticket.monday_board_id}/pulses/${ticket.monday_item_id}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {tickets.length > 0 && (
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">
            Showing {tickets.length} tickets
          </div>
        </Card>
      )}

      {/* Ticket Details Modal */}
      {showDetails && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">Ticket Details</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowDetails(false)
                  setSelectedTicket(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <p className="text-sm mt-1">{selectedTicket.ticket_title}</p>
                </div>
                <div>
                  <Label>Monday Item ID</Label>
                  <p className="text-sm mt-1">{selectedTicket.monday_item_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Status</Label>
                  <p className="text-sm mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </p>
                </div>
                <div>
                  <Label>Priority</Label>
                  <p className="text-sm mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="text-sm mt-1">{selectedTicket.ticket_type || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Team Assigned</Label>
                  <p className="text-sm mt-1">{selectedTicket.team_assigned || '-'}</p>
                </div>
                <div>
                  <Label>Reporter</Label>
                  <p className="text-sm mt-1">{selectedTicket.reporter || '-'}</p>
                </div>
                <div>
                  <Label>Assignee</Label>
                  <p className="text-sm mt-1">{selectedTicket.assignee || '-'}</p>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedTicket.description || 'No description provided'}</p>
              </div>

              <div>
                <Label>Agent Action Summary</Label>
                <div className="mt-1">
                  {selectedTicket.agent_action_summary ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{selectedTicket.agent_action_summary}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No agent actions recorded yet</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Created At</Label>
                  <p className="text-sm mt-1">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Updated At</Label>
                  <p className="text-sm mt-1">{new Date(selectedTicket.updated_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedTicket.monday_board_id && selectedTicket.monday_item_id && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => window.open(`https://digitalsarthi-company.monday.com/boards/${selectedTicket.monday_board_id}/pulses/${selectedTicket.monday_item_id}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in Monday.com
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}