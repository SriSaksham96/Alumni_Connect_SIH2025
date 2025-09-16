import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { messagesAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useMessaging = () => {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const queryClient = useQueryClient();

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useQuery('conversations', () => messagesAPI.getMessages(), {
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Fetch messages for selected conversation
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery(
    ['messages', selectedUserId],
    () => messagesAPI.getConversation(selectedUserId),
    {
      enabled: !!selectedUserId,
      staleTime: 10 * 1000, // 10 seconds
    }
  );

  // Fetch unread count
  const { data: unreadData } = useQuery(
    'unreadCount',
    () => messagesAPI.getUnreadCount(),
    {
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    (messageData) => messagesAPI.sendMessage(messageData),
    {
      onSuccess: () => {
        // Invalidate and refetch conversations and messages
        queryClient.invalidateQueries('conversations');
        queryClient.invalidateQueries(['messages', selectedUserId]);
        queryClient.invalidateQueries('unreadCount');
      },
      onError: (error) => {
        toast.error('Failed to send message');
        console.error('Send message error:', error);
      },
    }
  );

  // Mark message as read mutation
  const markAsReadMutation = useMutation(
    (messageId) => messagesAPI.markAsRead(messageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('conversations');
        queryClient.invalidateQueries('unreadCount');
      },
    }
  );

  // Handle sending a message
  const sendMessage = useCallback(
    (content) => {
      if (!selectedUserId || !content.trim()) return;

      sendMessageMutation.mutate({
        recipient: selectedUserId,
        content: content.trim(),
      });
    },
    [selectedUserId, sendMessageMutation]
  );

  // Handle conversation selection
  const selectConversation = useCallback((conversation) => {
    setSelectedConversationId(conversation.conversationId);
    setSelectedUserId(conversation.otherUser._id);
  }, []);

  // Handle starting a new conversation
  const startNewConversation = useCallback((user) => {
    setSelectedUserId(user._id);
    setSelectedConversationId(null);
  }, []);

  // Mark current conversation messages as read
  useEffect(() => {
    if (messagesData?.data?.messages) {
      const unreadMessages = messagesData.data.messages.filter(
        (msg) => !msg.isRead && msg.sender._id !== selectedUserId
      );
      
      unreadMessages.forEach((msg) => {
        markAsReadMutation.mutate(msg._id);
      });
    }
  }, [messagesData, selectedUserId, markAsReadMutation]);

  return {
    // Data
    conversations: conversationsData?.data?.conversations || [],
    messages: messagesData?.data?.messages || [],
    unreadCount: unreadData?.data?.unreadCount || 0,
    
    // States
    selectedConversationId,
    selectedUserId,
    conversationsLoading,
    messagesLoading,
    isSending: sendMessageMutation.isLoading,
    
    // Actions
    selectConversation,
    startNewConversation,
    sendMessage,
    
    // Errors
    conversationsError,
    messagesError,
  };
};

