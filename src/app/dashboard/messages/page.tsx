"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MessageSquare,
  Search,
  Send,
  Plus,
  Loader2,
  Check,
  CheckCheck,
  Users,
  ArrowLeft,
  MoreVertical,
  Trash2,
  X,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format, formatDistanceToNow } from "date-fns"

interface Conversation {
  id: string
  subject: string | null
  created_at: string
  last_message_at: string
  created_by: string
  participants: {
    user_id: string
    profile: {
      id: string
      full_name: string
      email: string
      avatar_url: string | null
      role: string
    }
  }[]
  last_message?: {
    content: string
    sender_id: string
    created_at: string
  }
  unread_count?: number
}

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  is_read: boolean
  sender?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

interface User {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role: string
}

export default function MessagesPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [newSubject, setNewSubject] = useState("")

  const fetchCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      if (profile) {
        setCurrentUser(profile)
        setIsAdmin(profile.role === "admin" || profile.role === "organizer")
      }
    }
  }, [])

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return
    
    try {
      // Get conversations where user is a participant
      const { data: participantData } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUser.id)

      if (!participantData || participantData.length === 0) {
        setConversations([])
        setIsLoading(false)
        return
      }

      const conversationIds = participantData.map(p => p.conversation_id)

      const { data: convData, error } = await supabase
        .from("conversations")
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            profile:profiles(id, full_name, email, avatar_url, role)
          )
        `)
        .in("id", conversationIds)
        .order("last_message_at", { ascending: false })

      if (error) throw error

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, sender_id, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          // Count unread messages
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", currentUser.id)

          return {
            ...conv,
            last_message: lastMsg || undefined,
            unread_count: count || 0,
          }
        })
      )

      setConversations(conversationsWithLastMessage)

      // Check if we should open a specific conversation
      const conversationId = searchParams.get("conversation")
      if (conversationId) {
        const conv = conversationsWithLastMessage.find(c => c.id === conversationId)
        if (conv) {
          setSelectedConversation(conv)
        }
      }
    } catch (error: any) {
      console.error("Error fetching conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, searchParams])

  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true)
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles(id, full_name, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])

      // Mark messages as read
      if (currentUser) {
        await supabase
          .from("messages")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .neq("sender_id", currentUser.id)
          .eq("is_read", false)
      }

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error: any) {
      console.error("Error fetching messages:", error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [currentUser])

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role")
      .order("full_name")
    
    setUsers(data || [])
  }, [])

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchConversations()
      fetchUsers()
    }
  }, [currentUser, fetchConversations, fetchUsers])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation, fetchMessages])

  // Real-time subscription for new messages in current conversation
  useEffect(() => {
    if (!selectedConversation) return

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async (payload) => {
          // Avoid duplicates by checking if message already exists
          const newMsg = payload.new as any
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            
            // Add message immediately for responsiveness
            const tempMessage: Message = {
              id: newMsg.id,
              content: newMsg.content,
              created_at: newMsg.created_at,
              sender_id: newMsg.sender_id,
              is_read: newMsg.is_read,
              sender: (newMsg.sender_id === currentUser?.id && currentUser) ? {
                id: currentUser.id,
                full_name: currentUser.full_name,
                avatar_url: currentUser.avatar_url,
              } : undefined,
            }
            return [...prev, tempMessage]
          })
          
          // Fetch complete message with sender info
          const { data } = await supabase
            .from("messages")
            .select(`*, sender:profiles(id, full_name, avatar_url)`)
            .eq("id", newMsg.id)
            .single()
            
          if (data) {
            setMessages(prev => prev.map(m => m.id === data.id ? data : m))
          }
          
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, currentUser])

  // Real-time subscription for conversations (new messages in any conversation)
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel(`user-conversations:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          // Refresh conversations when any new message arrives
          fetchConversations()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          // Trigger a notification refresh if header is listening
          window.dispatchEvent(new CustomEvent("new-notification"))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, fetchConversations])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return
    
    const messageContent = newMessage.trim()
    const tempId = `temp-${Date.now()}`
    
    // Optimistic update - add message immediately
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      created_at: new Date().toISOString(),
      sender_id: currentUser.id,
      is_read: false,
      sender: {
        id: currentUser.id,
        full_name: currentUser.full_name,
        avatar_url: currentUser.avatar_url,
      },
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage("")
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    
    setIsSending(true)

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: currentUser.id,
          content: messageContent,
        })
        .select()
        .single()

      if (error) throw error
      
      // Replace temp message with real one
      if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...optimisticMessage, id: data.id } : m))
      }
      
      // Update conversation's last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation.id)
        
      fetchConversations() // Refresh to update last message
    } catch (error: any) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(messageContent) // Restore the message
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0 || !currentUser) return
    setIsSending(true)

    try {
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({
          subject: newSubject || null,
          created_by: currentUser.id,
          is_group: selectedUsers.length > 1,
        })
        .select()
        .single()

      if (convError) throw convError

      // Add participants (including creator)
      const participants = [
        { conversation_id: conv.id, user_id: currentUser.id, is_admin: true },
        ...selectedUsers.map(userId => ({
          conversation_id: conv.id,
          user_id: userId,
          is_admin: false,
        })),
      ]

      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(participants)

      if (partError) throw partError

      toast({ title: "Conversation created" })
      setShowNewMessageDialog(false)
      setSelectedUsers([])
      setNewSubject("")
      fetchConversations()
    } catch (error: any) {
      toast({
        title: "Error creating conversation",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?"
  }

  const getOtherParticipants = (conv: Conversation) => {
    return conv.participants
      ?.filter(p => p.user_id !== currentUser?.id)
      .map(p => p.profile) || []
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const otherParticipants = getOtherParticipants(conv)
    return (
      conv.subject?.toLowerCase().includes(query) ||
      otherParticipants.some(p => p.full_name.toLowerCase().includes(query))
    )
  })

  const filteredUsers = users.filter(user => {
    if (user.id === currentUser?.id) return false
    if (!userSearchQuery) return true
    const query = userSearchQuery.toLowerCase()
    return (
      user.full_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex h-full gap-4">
        {/* Conversations List */}
        <Card className={`w-80 flex flex-col shrink-0 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <CardHeader className="pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Messages</CardTitle>
              {isAdmin && (
                <Button size="sm" onClick={() => setShowNewMessageDialog(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {conversations.length === 0 ? "No conversations yet" : "No matches found"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conv) => {
                  const otherParticipants = getOtherParticipants(conv)
                  const displayName = conv.subject || otherParticipants.map(p => p.full_name).join(", ") || "Unknown"
                  const isSelected = selectedConversation?.id === conv.id

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          {otherParticipants[0]?.avatar_url && (
                            <AvatarImage src={otherParticipants[0].avatar_url} />
                          )}
                          <AvatarFallback className={`text-xs ${isSelected ? "bg-primary-foreground text-primary" : ""}`}>
                            {otherParticipants[0] ? getInitials(otherParticipants[0].full_name) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">{displayName}</p>
                            {conv.unread_count && conv.unread_count > 0 && (
                              <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className={`text-xs truncate mt-0.5 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {conv.last_message.content}
                            </p>
                          )}
                          <p className={`text-xs mt-1 ${isSelected ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3 shrink-0 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(getOtherParticipants(selectedConversation)[0]?.full_name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {selectedConversation.subject || getOtherParticipants(selectedConversation).map(p => p.full_name).join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.participants?.length} participants
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender_id === currentUser?.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : ""}`}>
                          {!isOwn && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={message.sender?.avatar_url || ""} />
                              <AvatarFallback className="text-xs">
                                {getInitials(message.sender?.full_name || "")}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            {!isOwn && (
                              <p className="text-xs text-muted-foreground mb-1 ml-1">
                                {message.sender?.full_name}
                              </p>
                            )}
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                isOwn
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(message.created_at), "h:mm a")}
                              </p>
                              {isOwn && (
                                message.is_read ? (
                                  <CheckCheck className="h-3 w-3 text-primary" />
                                ) : (
                                  <Check className="h-3 w-3 text-muted-foreground" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t shrink-0">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="min-h-[44px] max-h-32 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    size="icon"
                    className="shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground mb-4">
                Choose a conversation from the list or start a new one
              </p>
              {isAdmin && (
                <Button onClick={() => setShowNewMessageDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Message
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* New Message Dialog */}
      <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>Start a new conversation with one or more users</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Enter a subject..."
              />
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(userId => {
                  const user = users.find(u => u.id === userId)
                  if (!user) return null
                  return (
                    <Badge key={userId} variant="secondary" className="pl-2 pr-1 py-1">
                      {user.full_name}
                      <button
                        onClick={() => setSelectedUsers(prev => prev.filter(id => id !== userId))}
                        className="ml-1 hover:bg-muted rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}

            {/* User Search */}
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="pl-10"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {filteredUsers.slice(0, 10).map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (selectedUsers.includes(user.id)) {
                        setSelectedUsers(prev => prev.filter(id => id !== user.id))
                      } else {
                        setSelectedUsers(prev => [...prev, user.id])
                      }
                    }}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                      selectedUsers.includes(user.id) ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback className="text-xs">{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">{user.role}</Badge>
                    {selectedUsers.includes(user.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMessageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateConversation} disabled={selectedUsers.length === 0 || isSending}>
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
