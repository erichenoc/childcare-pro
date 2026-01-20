// =====================================================
// AI Assistant Types
// =====================================================

export interface AIConversation {
  id: string
  organization_id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
}

export interface AIMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  tool_calls?: ToolCall[]
  tool_results?: ToolResult[]
  pending_confirmation?: PendingConfirmation
  created_at: string
  metadata?: Record<string, unknown>
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  tool_call_id: string
  name: string
  result: unknown
  error?: string
}

export interface PendingConfirmation {
  action_id: string
  action_type: string
  description: string
  params: Record<string, unknown>
  requires_confirmation: boolean
}

export interface AIPendingAction {
  id: string
  conversation_id: string
  message_id: string | null
  action_type: string
  action_params: Record<string, unknown>
  status: 'pending' | 'confirmed' | 'rejected' | 'expired'
  created_at: string
  expires_at: string
  confirmed_at: string | null
  result: unknown
}

// Tool Definition (OpenAI function calling format)
export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, {
        type: string
        description: string
        enum?: string[]
        items?: { type: string }
      }>
      required?: string[]
    }
  }
}

// Tool Categories
export type ToolCategory =
  | 'children'
  | 'families'
  | 'staff'
  | 'attendance'
  | 'classrooms'
  | 'incidents'
  | 'billing'
  | 'reports'
  | 'communication'
  | 'compliance'
  | 'analytics'

// Tool metadata for UI
export interface ToolMetadata {
  name: string
  category: ToolCategory
  description: string
  requiresConfirmation: boolean
  isReadOnly: boolean
  icon?: string
}

// Chat State
export interface AIChatState {
  messages: AIMessage[]
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  conversationId: string | null
  pendingAction: PendingConfirmation | null
}

// API Request/Response types
export interface AIAssistantRequest {
  message: string
  conversationId?: string
  context?: {
    currentPage: string
    selectedEntity?: {
      type: string
      id: string
    }
  }
}

export interface AIAssistantResponse {
  message: string
  conversationId: string
  toolCalls?: ToolCall[]
  pendingConfirmation?: PendingConfirmation
}

// Streaming events
export type StreamEvent =
  | { type: 'content'; delta: string }
  | { type: 'tool_call'; tool: ToolCall }
  | { type: 'tool_result'; result: ToolResult }
  | { type: 'confirmation_required'; action: PendingConfirmation }
  | { type: 'done' }
  | { type: 'error'; error: string }

// System prompt context
export interface AssistantContext {
  organizationName: string
  userName: string
  userRole: string
  currentPage: string
  currentDate: string
  currentTime: string
  language: 'es' | 'en'
}
