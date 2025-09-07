import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request body
    const payload = await req.json()
    
    // Handle Monday.com webhook URL verification challenge
    // According to Monday.com docs: respond with the exact same JSON body
    if (payload.challenge) {
      console.log('Received Monday.com challenge:', payload.challenge)
      // Simply echo back the entire request body
      return new Response(
        JSON.stringify(payload),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client for actual webhook events
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    console.log('Monday.com webhook payload:', JSON.stringify(payload, null, 2))

    // Extract the event from the payload (Monday.com wraps the actual data in an 'event' field)
    const event = payload.event

    if (!event) {
      console.log('No event field in payload, returning success')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No event to process'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle create_pulse/create_item events
    if (event.type === 'create_pulse' || event.type === 'create_item') {
      // Extract ticket information from the Monday.com event structure
      const ticketData = {
        monday_item_id: event.pulseId?.toString() || event.itemId?.toString() || 'unknown',
        ticket_title: event.pulseName || event.itemName || 'Untitled Ticket',
        ticket_type: null as string | null,
        team_assigned: null as string | null,
        status: 'Open',
        priority: 'Medium',
        description: null as string | null,
        reporter: event.userId?.toString() || null,
        assignee: null as string | null,
        monday_board_id: event.boardId?.toString() || null,
      }

      // Extract additional information from column values if available
      if (event.columnValues && typeof event.columnValues === 'object') {
        // Monday.com sends columnValues as an object with column IDs as keys
        for (const [columnId, columnData] of Object.entries(event.columnValues)) {
          if (typeof columnData === 'object' && columnData !== null) {
            const column = columnData as any
            
            // Try to map based on column title if available
            const title = column.title?.toLowerCase() || ''
            
            switch (title) {
              case 'status':
                // Handle color columns
                if (column.label?.text) {
                  ticketData.status = column.label.text
                } else if (column.text) {
                  ticketData.status = column.text
                }
                break
              case 'priority':
                // Handle color columns
                if (column.label?.text) {
                  ticketData.priority = column.label.text
                } else if (column.text) {
                  ticketData.priority = column.text
                }
                break
              case 'type':
              case 'ticket type':
                if (column.text) {
                  ticketData.ticket_type = column.text
                }
                break
              case 'description':
              case 'notes':
                if (column.text) {
                  ticketData.description = column.text
                }
                break
              case 'assignee':
              case 'person':
                if (column.personsAndTeams?.length > 0) {
                  ticketData.assignee = column.personsAndTeams[0].name
                } else if (column.text) {
                  ticketData.assignee = column.text
                }
                break
            }
          }
        }
      }

      // If ticket type is provided, try to find the assigned team
      if (ticketData.ticket_type) {
        const { data: mapping, error: mappingError } = await supabaseClient
          .from('ticket_type_team_mapping')
          .select('team_name')
          .eq('ticket_type', ticketData.ticket_type)
          .single()

        if (!mappingError && mapping) {
          ticketData.team_assigned = mapping.team_name
        }
      }

      // Insert the ticket into the database
      const { error: insertError } = await supabaseClient
        .from('tickets')
        .upsert([ticketData], {
          onConflict: 'monday_item_id',
          ignoreDuplicates: false
        })

      if (insertError) {
        console.error('Error inserting ticket:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to insert ticket', details: insertError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Successfully processed ticket:', ticketData)
      
      // If the new ticket has status "Reported", call the n8n webhook
      if (ticketData.status === 'Reported') {
        try {
          console.log('New ticket created with Reported status, calling n8n webhook for ticket:', ticketData.monday_item_id)
          
          const n8nResponse = await fetch(
            'https://n8n.mathcurious.net/webhook/4085e4d6-7d0a-49bb-8715-34e096e989b5',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ticket_id: ticketData.monday_item_id,
                monday_item_id: ticketData.monday_item_id,
                status: 'Reported',
                ticket_title: ticketData.ticket_title,
                board_id: ticketData.monday_board_id,
                created: true
              })
            }
          )

          if (!n8nResponse.ok) {
            console.error('Failed to call n8n webhook:', n8nResponse.status, await n8nResponse.text())
          } else {
            console.log('Successfully called n8n webhook for new ticket:', ticketData.monday_item_id)
          }
        } catch (webhookError) {
          // Log the error but don't fail the main request
          console.error('Error calling n8n webhook:', webhookError)
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Ticket processed successfully',
          ticket_id: ticketData.monday_item_id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle update_column_value events
    if (event.type === 'update_column_value') {
      const pulseId = event.pulseId?.toString() || event.itemId?.toString()
      
      if (!pulseId) {
        console.error('No pulse/item ID found in update event')
        return new Response(
          JSON.stringify({ error: 'No item ID found in update event' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // Extract the updated column value
      if (event.columnId && event.value) {
        const columnTitle = event.columnTitle?.toLowerCase() || ''
        
        switch (columnTitle) {
          case 'status':
            // For color columns (status), extract the label text
            if (event.columnType === 'color' && event.value.label) {
              updateData.status = event.value.label.text
            } else if (typeof event.value === 'string') {
              updateData.status = event.value
            } else if (event.value.text) {
              updateData.status = event.value.text
            }
            break
          case 'priority':
            // Handle priority which might also be a color column
            if (event.columnType === 'color' && event.value.label) {
              updateData.priority = event.value.label.text
            } else if (typeof event.value === 'string') {
              updateData.priority = event.value
            } else if (event.value.text) {
              updateData.priority = event.value.text
            }
            break
          case 'type':
          case 'ticket type':
            if (typeof event.value === 'string') {
              updateData.ticket_type = event.value
            } else if (event.value.text) {
              updateData.ticket_type = event.value.text
            }
            break
          case 'description':
          case 'notes':
            if (typeof event.value === 'string') {
              updateData.description = event.value
            } else if (event.value.text) {
              updateData.description = event.value.text
            }
            break
          case 'assignee':
          case 'person':
            if (event.value.personsAndTeams?.length > 0) {
              updateData.assignee = event.value.personsAndTeams[0].name
            } else if (typeof event.value === 'string') {
              updateData.assignee = event.value
            } else if (event.value.text) {
              updateData.assignee = event.value.text
            }
            break
        }
      }

      // If ticket type was updated, update the team assignment
      if (updateData.ticket_type) {
        const { data: mapping, error: mappingError } = await supabaseClient
          .from('ticket_type_team_mapping')
          .select('team_name')
          .eq('ticket_type', updateData.ticket_type)
          .single()

        if (!mappingError && mapping) {
          updateData.team_assigned = mapping.team_name
        }
      }

      // Check if we should call the webhook BEFORE updating the database
      let shouldCallWebhook = false
      let previousStatus = null
      
      if (updateData.status === 'Reported') {
        // First check if the ticket exists and get its current status
        const { data: existingTicket } = await supabaseClient
          .from('tickets')
          .select('status')
          .eq('monday_item_id', pulseId)
          .single()
        
        if (existingTicket) {
          previousStatus = existingTicket.status
          // Only call webhook if status is changing FROM a different status TO "Reported"
          shouldCallWebhook = existingTicket.status !== 'Reported'
          console.log(`Status check - Previous: ${existingTicket.status}, New: Reported, Will call webhook: ${shouldCallWebhook}`)
        } else {
          // If ticket doesn't exist yet, we'll call the webhook when it's created with Reported status
          shouldCallWebhook = true
          console.log('New ticket will be created with Reported status, will call webhook')
        }
      }

      // Update the ticket in the database, or create if it doesn't exist
      const { data: updateResult, error: updateError } = await supabaseClient
        .from('tickets')
        .update(updateData)
        .eq('monday_item_id', pulseId)
        .select()

      // If no rows were updated, the ticket doesn't exist, so create it
      if (!updateError && (!updateResult || updateResult.length === 0)) {
        console.log('Ticket not found, creating new ticket for:', pulseId)
        
        const newTicketData = {
          monday_item_id: pulseId,
          ticket_title: event.pulseName || 'Untitled Ticket',
          ticket_type: null,
          team_assigned: null,
          status: 'Open',
          priority: 'Medium',
          description: null,
          reporter: event.userId?.toString() || null,
          assignee: null,
          monday_board_id: event.boardId?.toString() || null,
          ...updateData // Apply the update data to the new ticket
        }

        const { error: insertError } = await supabaseClient
          .from('tickets')
          .insert([newTicketData])

        if (insertError) {
          console.error('Error creating ticket:', insertError)
          return new Response(
            JSON.stringify({ error: 'Failed to create ticket', details: insertError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        console.log('Successfully created new ticket:', newTicketData)
      } else if (updateError) {
        console.error('Error updating ticket:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update ticket', details: updateError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // If status was updated to "Reported" and we determined we should call the webhook
      if (shouldCallWebhook) {
        try {
          console.log(`Status changed to Reported (from: ${previousStatus}), calling n8n webhook for ticket:`, pulseId)
          
          const n8nResponse = await fetch(
            'https://n8n.mathcurious.net/webhook/4085e4d6-7d0a-49bb-8715-34e096e989b5',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ticket_id: pulseId,
                monday_item_id: pulseId,
                status: 'Reported',
                updated_at: updateData.updated_at,
                ticket_title: event.pulseName || null,
                board_id: event.boardId?.toString() || null
              })
            }
          )

          if (!n8nResponse.ok) {
            console.error('Failed to call n8n webhook:', n8nResponse.status, await n8nResponse.text())
          } else {
            console.log('Successfully called n8n webhook for ticket:', pulseId)
          }
        } catch (webhookError) {
          // Log the error but don't fail the main request
          console.error('Error calling n8n webhook:', webhookError)
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Ticket updated successfully',
          pulse_id: pulseId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle update_name events
    if (event.type === 'update_name') {
      const pulseId = event.pulseId?.toString() || event.itemId?.toString()
      
      if (!pulseId) {
        console.error('No pulse/item ID found in update_name event')
        return new Response(
          JSON.stringify({ error: 'No item ID found in update_name event' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Extract the new name from the event
      const newName = event.value?.name
      
      if (!newName) {
        console.error('No new name found in update_name event')
        return new Response(
          JSON.stringify({ error: 'No new name found in update_name event' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Update the ticket title in the database, or create if it doesn't exist
      const updateData = {
        ticket_title: newName,
        updated_at: new Date().toISOString()
      }

      const { data: updateResult, error: updateError } = await supabaseClient
        .from('tickets')
        .update(updateData)
        .eq('monday_item_id', pulseId)
        .select()

      // If no rows were updated, the ticket doesn't exist, so create it
      if (!updateError && (!updateResult || updateResult.length === 0)) {
        console.log('Ticket not found, creating new ticket for:', pulseId)
        
        const newTicketData = {
          monday_item_id: pulseId,
          ticket_title: newName,
          ticket_type: null,
          team_assigned: null,
          status: 'Open',
          priority: 'Medium',
          description: null,
          reporter: event.userId?.toString() || null,
          assignee: null,
          monday_board_id: event.boardId?.toString() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: insertError } = await supabaseClient
          .from('tickets')
          .insert([newTicketData])

        if (insertError) {
          console.error('Error creating ticket:', insertError)
          return new Response(
            JSON.stringify({ error: 'Failed to create ticket', details: insertError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        console.log('Successfully created new ticket:', newTicketData)
      } else if (updateError) {
        console.error('Error updating ticket name:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update ticket name', details: updateError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log(`Successfully updated ticket name from "${event.previousValue?.name}" to "${newName}" for ticket:`, pulseId)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Ticket name updated successfully',
          pulse_id: pulseId,
          new_name: newName
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle delete events
    if (event.type === 'delete_pulse' || event.type === 'delete_item') {
      const pulseId = event.pulseId?.toString() || event.itemId?.toString()
      
      if (pulseId) {
        const { error: deleteError } = await supabaseClient
          .from('tickets')
          .delete()
          .eq('monday_item_id', pulseId)

        if (deleteError) {
          console.error('Error deleting ticket:', deleteError)
          return new Response(
            JSON.stringify({ error: 'Failed to delete ticket', details: deleteError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Ticket deleted successfully',
            pulse_id: pulseId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // For other event types, just log and return success
    console.log('Received Monday.com webhook with event type:', event.type)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook received',
        event_type: event.type
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})