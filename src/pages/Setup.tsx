import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { MondayConfig } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Copy, ExternalLink } from 'lucide-react'

export default function Setup() {
  const [config, setConfig] = useState<MondayConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    webhook_url: '',
    api_token: '',
    board_id: ''
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('monday_config')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setConfig(data)
        setFormData({
          webhook_url: data.webhook_url,
          api_token: data.api_token,
          board_id: data.board_id
        })
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      if (config) {
        const { error } = await supabase
          .from('monday_config')
          .update(formData)
          .eq('id', config.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('monday_config')
          .insert([formData])
        
        if (error) throw error
      }

      fetchConfig()
    } catch (error) {
      console.error('Error saving config:', error)
    } finally {
      setSaving(false)
    }
  }

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/webhook/monday`
    navigator.clipboard.writeText(webhookUrl)
  }

  const getWebhookUrl = () => {
    return `${window.location.origin}/api/webhook/monday`
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold mb-2">Monday.com Setup</h2>
        <p className="text-muted-foreground">
          Configure your Monday.com integration to receive tickets automatically.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">Webhook URL</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Use this URL as your Monday.com webhook endpoint:
            </p>
            <div className="flex items-center space-x-2 bg-muted p-3 rounded-md">
              <code className="text-sm flex-1">{getWebhookUrl()}</code>
              <Button size="sm" variant="outline" onClick={copyWebhookUrl}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Monday.com Configuration</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="webhook_url">Webhook URL (from Monday.com)</Label>
            <Input
              id="webhook_url"
              value={formData.webhook_url}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              placeholder="https://webhook.monday.com/..."
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              The webhook URL provided by Monday.com for your integration
            </p>
          </div>

          <div>
            <Label htmlFor="api_token">API Token</Label>
            <Input
              id="api_token"
              type="password"
              value={formData.api_token}
              onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
              placeholder="Your Monday.com API token"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Your Monday.com API token for making API calls
            </p>
          </div>

          <div>
            <Label htmlFor="board_id">Board ID</Label>
            <Input
              id="board_id"
              value={formData.board_id}
              onChange={(e) => setFormData({ ...formData, board_id: e.target.value })}
              placeholder="123456789"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              The ID of your Monday.com board where tickets are created
            </p>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : config ? 'Update Configuration' : 'Save Configuration'}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Setup Instructions</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <h4 className="font-medium">Create a Monday.com Integration</h4>
              <p className="text-sm text-muted-foreground">
                Go to your Monday.com account and create a new integration or webhook.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <h4 className="font-medium">Configure the Webhook</h4>
              <p className="text-sm text-muted-foreground">
                Set the webhook URL to the endpoint shown above and configure it to trigger on item creation.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">
              3
            </div>
            <div>
              <h4 className="font-medium">Get Your API Token</h4>
              <p className="text-sm text-muted-foreground">
                Generate an API token from Monday.com and enter it in the form above.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">
              4
            </div>
            <div>
              <h4 className="font-medium">Save Configuration</h4>
              <p className="text-sm text-muted-foreground">
                Fill in all the required fields above and save your configuration.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <Button variant="outline" asChild>
            <a 
              href="https://monday.com/developers/apps" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Monday.com Developer Docs
            </a>
          </Button>
        </div>
      </Card>

      {config && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Configuration Saved</h3>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Your Monday.com integration is configured and ready to receive webhooks.
          </p>
        </Card>
      )}
    </div>
  )
}