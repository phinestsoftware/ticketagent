-- Table for mapping ticket types to teams
CREATE TABLE IF NOT EXISTS ticket_type_team_mapping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_type VARCHAR(255) NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ticket_type)
);

-- Table for device logs
CREATE TABLE IF NOT EXISTS device_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mobile_device_number VARCHAR(50) NOT NULL,
    log_message TEXT NOT NULL,
    log_level VARCHAR(50) DEFAULT 'INFO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tickets from Monday.com webhook
CREATE TABLE IF NOT EXISTS tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monday_item_id VARCHAR(255) NOT NULL UNIQUE,
    ticket_title VARCHAR(500) NOT NULL,
    ticket_type VARCHAR(255),
    team_assigned VARCHAR(255),
    status VARCHAR(100) DEFAULT 'Open',
    priority VARCHAR(50) DEFAULT 'Medium',
    description TEXT,
    reporter VARCHAR(255),
    assignee VARCHAR(255),
    monday_board_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_logs_mobile_number ON device_logs(mobile_device_number);
CREATE INDEX IF NOT EXISTS idx_device_logs_created_at ON device_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(ticket_type);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- Enable Row Level Security
ALTER TABLE ticket_type_team_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Table for Monday.com configuration
CREATE TABLE IF NOT EXISTS monday_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_url VARCHAR(500) NOT NULL,
    api_token VARCHAR(500) NOT NULL,
    board_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for monday_config
ALTER TABLE monday_config ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on ticket_type_team_mapping" ON ticket_type_team_mapping
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on device_logs" ON device_logs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tickets" ON tickets
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on monday_config" ON monday_config
    FOR ALL USING (true) WITH CHECK (true);