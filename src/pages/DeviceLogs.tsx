import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { DeviceLog } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Search } from 'lucide-react'

export default function DeviceLogs() {
  const [logs, setLogs] = useState<DeviceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    mobile_device_number: '',
    log_message: '',
    log_level: 'INFO'
  })

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from('device_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`mobile_device_number.ilike.%${searchTerm}%,log_message.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchLogs()
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        const { error } = await supabase
          .from('device_logs')
          .update(formData)
          .eq('id', editing)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('device_logs')
          .insert([formData])
        
        if (error) throw error
      }

      setFormData({ mobile_device_number: '', log_message: '', log_level: 'INFO' })
      setEditing(null)
      setShowAddForm(false)
      fetchLogs()
    } catch (error) {
      console.error('Error saving log:', error)
    }
  }

  const handleEdit = (log: DeviceLog) => {
    setFormData({
      mobile_device_number: log.mobile_device_number,
      log_message: log.log_message,
      log_level: log.log_level
    })
    setEditing(log.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log entry?')) return
    
    try {
      const { error } = await supabase
        .from('device_logs')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchLogs()
    } catch (error) {
      console.error('Error deleting log:', error)
    }
  }

  const resetForm = () => {
    setFormData({ mobile_device_number: '', log_message: '', log_level: 'INFO' })
    setEditing(null)
    setShowAddForm(false)
  }

  const getLogLevelBadge = (level: string) => {
    const colors = {
      'ERROR': 'bg-red-100 text-red-800',
      'WARN': 'bg-yellow-100 text-yellow-800',
      'INFO': 'bg-blue-100 text-blue-800',
      'DEBUG': 'bg-gray-100 text-gray-800'
    }
    return colors[level as keyof typeof colors] || colors.INFO
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Device Logs</h2>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Log Entry
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by device number or log message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {showAddForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editing ? 'Edit Log Entry' : 'Add New Log Entry'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="mobile_device_number">Mobile Device Number</Label>
              <Input
                id="mobile_device_number"
                value={formData.mobile_device_number}
                onChange={(e) => setFormData({ ...formData, mobile_device_number: e.target.value })}
                placeholder="e.g., +1234567890"
                required
              />
            </div>
            <div>
              <Label htmlFor="log_level">Log Level</Label>
              <Select
                value={formData.log_level}
                onValueChange={(value) => setFormData({ ...formData, log_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select log level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                  <SelectItem value="WARN">WARN</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="log_message">Log Message</Label>
              <Textarea
                id="log_message"
                value={formData.log_message}
                onChange={(e) => setFormData({ ...formData, log_message: e.target.value })}
                placeholder="Enter log message..."
                required
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit">
                {editing ? 'Update' : 'Create'} Log Entry
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
              <TableHead>Device Number</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No log entries found. Add your first log entry above.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.mobile_device_number}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLogLevelBadge(log.log_level)}`}>
                      {log.log_level}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.log_message}
                  </TableCell>
                  <TableCell>
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(log)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(log.id)}
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