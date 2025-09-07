export interface TicketTypeTeamMapping {
  id: string
  ticket_type: string
  team_name: string
  owner_id: string | null
  created_at: string
  updated_at: string
}

export interface DeviceLog {
  id: string
  mobile_device_number: string
  log_message: string
  log_level: string
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  monday_item_id: string
  ticket_title: string
  ticket_type: string | null
  team_assigned: string | null
  status: string
  priority: string
  description: string | null
  reporter: string | null
  assignee: string | null
  monday_board_id: string | null
  agent_action_summary: string | null
  created_at: string
  updated_at: string
}

export interface MondayConfig {
  id: string
  webhook_url: string
  api_token: string
  board_id: string
  created_at: string
  updated_at: string
}

export interface EsimProfile {
  id: string
  iccid_value: string
  qr_image: string
  activation_code: string
  progress_bar_percentage: number
  status: string
  smdp_status: string
  device_number: string | null
  created_at: string
  updated_at: string
}