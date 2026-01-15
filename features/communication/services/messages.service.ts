import { createClient } from '@/shared/lib/supabase/client'
import type { Message, TablesInsert } from '@/shared/types/database.types'

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

export interface MessageWithSender extends Message {
  sender?: {
    id: string
    first_name: string
    last_name: string
    role: string
  } | null
  family?: {
    id: string
    primary_contact_name: string
  } | null
}

export const messagesService = {
  async getInbox(userId: string): Promise<MessageWithSender[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:staff!messages_sender_id_fkey(id, first_name, last_name, role),
        family:families(id, primary_contact_name)
      `)
      .eq('organization_id', DEMO_ORG_ID)
      .or(`recipient_id.eq.${userId},recipient_id.is.null`)
      .neq('message_type', 'announcement')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as MessageWithSender[]
  },

  async getSent(userId: string): Promise<MessageWithSender[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        family:families(id, primary_contact_name)
      `)
      .eq('organization_id', DEMO_ORG_ID)
      .eq('sender_id', userId)
      .neq('message_type', 'announcement')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as MessageWithSender[]
  },

  async getAnnouncements(): Promise<Message[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('organization_id', DEMO_ORG_ID)
      .eq('message_type', 'announcement')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<MessageWithSender | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:staff!messages_sender_id_fkey(id, first_name, last_name, role),
        family:families(id, primary_contact_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as MessageWithSender
  },

  async markAsRead(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
  },

  async create(message: Omit<TablesInsert<'messages'>, 'organization_id'>): Promise<Message> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...message,
        organization_id: DEMO_ORG_ID,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getStats() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .select('id, is_read, message_type, sender_id')
      .eq('organization_id', DEMO_ORG_ID)

    if (error) throw error

    const messages = data || []
    const inbox = messages.filter(m => m.message_type !== 'announcement')
    const unread = inbox.filter(m => !m.is_read).length
    const sent = messages.filter(m => m.message_type !== 'announcement').length
    const announcements = messages.filter(m => m.message_type === 'announcement').length

    return {
      unread,
      inbox: inbox.length,
      sent,
      announcements,
    }
  },

  async getAll(): Promise<MessageWithSender[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:staff!messages_sender_id_fkey(id, first_name, last_name, role),
        family:families(id, primary_contact_name)
      `)
      .eq('organization_id', DEMO_ORG_ID)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as MessageWithSender[]
  },
}
