import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { EsimProfile } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Edit, Trash2, RefreshCw } from 'lucide-react'

export default function EsimProfiles() {
  const [profiles, setProfiles] = useState<EsimProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState<EsimProfile | null>(null)
  const [formData, setFormData] = useState({
    iccid_value: '',
    qr_image: '',
    activation_code: '',
    progress_bar_percentage: 0,
    status: '',
    smdp_status: '',
    device_number: ''
  })

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      let query = supabase
        .from('esim_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`iccid_value.ilike.%${searchTerm}%,activation_code.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%`)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      setProfiles(data || [])
    } catch (error) {
      console.error('Error fetching ESim profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchProfiles()
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, statusFilter])

  const resetForm = () => {
    setFormData({
      iccid_value: '',
      qr_image: '',
      activation_code: '',
      progress_bar_percentage: 0,
      status: '',
      smdp_status: '',
      device_number: ''
    })
    setEditingProfile(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProfile) {
        const { error } = await supabase
          .from('esim_profiles')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingProfile.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('esim_profiles')
          .insert([formData])
        
        if (error) throw error
      }
      
      await fetchProfiles()
      resetForm()
    } catch (error) {
      console.error('Error saving ESim profile:', error)
    }
  }

  const handleEdit = (profile: EsimProfile) => {
    setFormData({
      iccid_value: profile.iccid_value,
      qr_image: profile.qr_image,
      activation_code: profile.activation_code,
      progress_bar_percentage: profile.progress_bar_percentage,
      status: profile.status,
      smdp_status: profile.smdp_status,
      device_number: profile.device_number || ''
    })
    setEditingProfile(profile)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ESim profile?')) return
    
    try {
      const { error } = await supabase
        .from('esim_profiles')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await fetchProfiles()
    } catch (error) {
      console.error('Error deleting ESim profile:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'error': 'bg-red-100 text-red-800'
    }
    return colors[status.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">ESim Profiles</h2>
        <div className="flex gap-2">
          <Button onClick={fetchProfiles} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Profile
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingProfile ? 'Edit ESim Profile' : 'Add New ESim Profile'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="iccid_value">ICCID Value</Label>
                <Input
                  id="iccid_value"
                  value={formData.iccid_value}
                  onChange={(e) => setFormData({...formData, iccid_value: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="activation_code">Activation Code</Label>
                <Input
                  id="activation_code"
                  value={formData.activation_code}
                  onChange={(e) => setFormData({...formData, activation_code: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="device_number">Device Number</Label>
                <Input
                  id="device_number"
                  value={formData.device_number}
                  onChange={(e) => setFormData({...formData, device_number: e.target.value})}
                  placeholder="e.g., +1234567890"
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="smdp_status">SMDP Status</Label>
                <Input
                  id="smdp_status"
                  value={formData.smdp_status}
                  onChange={(e) => setFormData({...formData, smdp_status: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="progress_bar_percentage">Progress (%)</Label>
                <Input
                  id="progress_bar_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress_bar_percentage}
                  onChange={(e) => setFormData({...formData, progress_bar_percentage: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="qr_image">QR Image URL</Label>
              <Textarea
                id="qr_image"
                value={formData.qr_image}
                onChange={(e) => setFormData({...formData, qr_image: e.target.value})}
                placeholder="Enter QR code image URL or data"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProfile ? 'Update' : 'Create'} Profile
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search profiles..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ICCID Value</TableHead>
              <TableHead>Device Number</TableHead>
              <TableHead>Activation Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SMDP Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No ESim profiles found. Click "Add Profile" to create one.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    <div className="max-w-xs truncate" title={profile.iccid_value}>
                      {profile.iccid_value}
                    </div>
                  </TableCell>
                  <TableCell>{profile.device_number || '-'}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={profile.activation_code}>
                      {profile.activation_code}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(profile.status)}`}>
                      {profile.status}
                    </span>
                  </TableCell>
                  <TableCell>{profile.smdp_status}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.min(100, Math.max(0, profile.progress_bar_percentage))}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {profile.progress_bar_percentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(profile.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(profile)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(profile.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {profiles.length > 0 && (
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">
            Showing {profiles.length} ESim profiles
          </div>
        </Card>
      )}
    </div>
  )
}