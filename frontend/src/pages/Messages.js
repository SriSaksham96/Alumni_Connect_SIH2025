import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMessaging } from '../hooks/useMessaging';
import ConversationList from '../components/messaging/ConversationList';
import MessageList from '../components/messaging/MessageList';
import MessageInput from '../components/messaging/MessageInput';
import NewMessageModal from '../components/messaging/NewMessageModal';
import { HiChat, HiPlus, HiUser } from 'react-icons/hi';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Messages = () => {
  const { user } = useAuth();
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const {
    conversations,
    messages,
    unreadCount,
    selectedConversationId,
    selectedUserId,
    conversationsLoading,
    messagesLoading,
    isSending,
    selectConversation,
    startNewConversation,
    sendMessage,
    conversationsError,
    messagesError,
  } = useMessaging();

  const selectedConversation = conversations.find(
    (conv) => conv.conversationId === selectedConversationId
  );

  const handleNewMessage = (selectedUser) => {
    startNewConversation(selectedUser);
    setShowNewMessageModal(false);
  };

  if (conversationsError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center py-12">
                <p className="text-red-600">Error loading messages. Please try again.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg h-[calc(100vh-8rem)]">
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
                  <button
                    onClick={() => setShowNewMessageModal(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <HiPlus className="h-4 w-4 mr-1" />
                    New
                  </button>
                </div>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {conversationsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <ConversationList
                    conversations={conversations}
                    onSelectConversation={selectConversation}
                    selectedConversationId={selectedConversationId}
                  />
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedUserId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      {selectedConversation?.otherUser?.profile?.profilePicture ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={selectedConversation.otherUser.profile.profilePicture}
                          alt={selectedConversation.otherUser.firstName}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <HiUser className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">
                          {selectedConversation?.otherUser?.firstName}{' '}
                          {selectedConversation?.otherUser?.lastName}
                        </h2>
                        {selectedConversation?.otherUser?.profile?.currentJob && (
                          <p className="text-sm text-gray-600">
                            {selectedConversation.otherUser.profile.currentJob}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <MessageList
                    messages={messages}
                    currentUserId={user?._id}
                    isLoading={messagesLoading}
                  />

                  {/* Message Input */}
                  <MessageInput
                    onSendMessage={sendMessage}
                    disabled={isSending}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <HiChat className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-600">
                      Choose a conversation from the sidebar or start a new one
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onSelectUser={handleNewMessage}
      />
    </div>
  );
};

export default Messages;
