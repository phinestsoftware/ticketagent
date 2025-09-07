import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { TicketTypeTeamMapping } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function TicketMappings() {
  const [mappings, setMappings] = useState<TicketTypeTeamMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    ticket_type: '',
    team_name: '',
    owner_id: ''
  })

  useEffect(() => {
    fetchMappings()
  }, [])

  const fetchMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_type_team_mapping')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMappings(data || [])
    } catch (error) {
      console.error('Error fetching mappings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        const { error } = await supabase
          .from('ticket_type_team_mapping')
          .update(formData)
          .eq('id', editing)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ticket_type_team_mapping')
          .insert([formData])
        
        if (error) throw error
      }

      setFormData({ ticket_type: '', team_name: '', owner_id: '' })
      setEditing(null)
      setShowAddForm(false)
      fetchMappings()
    } catch (error) {
      console.error('Error saving mapping:', error)
    }
  }

  const handleEdit = (mapping: TicketTypeTeamMapping) => {
    setFormData({
      ticket_type: mapping.ticket_type,
      team_name: mapping.team_name,
      owner_id: mapping.owner_id || ''
    })
    setEditing(mapping.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return
    
    try {
      const { error } = await supabase
        .from('ticket_type_team_mapping')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchMappings()
    } catch (error) {
      console.error('Error deleting mapping:', error)
    }
  }

  const resetForm = () => {
    setFormData({ ticket_type: '', team_name: '', owner_id: '' })
    setEditing(null)
    setShowAddForm(false)
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Ticket Type to Team Mappings</h2>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Mapping
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editing ? 'Edit Mapping' : 'Add New Mapping'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="ticket_type">Ticket Type</Label>
              <Input
                id="ticket_type"
                value={formData.ticket_type}
                onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value })}
                placeholder="e.g., Bug Report, Feature Request"
                required
              />
            </div>
            <div>
              <Label htmlFor="team_name">Team Name</Label>
              <Input
                id="team_name"
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                placeholder="e.g., Development Team, QA Team"
                required
              />
            </div>
            <div>
              <Label htmlFor="owner_id">Owner ID</Label>
              <Input
                id="owner_id"
                value={formData.owner_id}
                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                placeholder="e.g., owner123, john.doe@company.com"
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit">
                {editing ? 'Update' : 'Create'} Mapping
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket Type</TableHead>
              <TableHead>Team Name</TableHead>
              <TableHead>Owner ID</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No mappings found. Add your first mapping above.
                </TableCell>
              </TableRow>
            ) : (
              mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">{mapping.ticket_type}</TableCell>
                  <TableCell>{mapping.team_name}</TableCell>
                  <TableCell>{mapping.owner_id || '-'}</TableCell>
                  <TableCell>
                    {new Date(mapping.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(mapping)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(mapping.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}