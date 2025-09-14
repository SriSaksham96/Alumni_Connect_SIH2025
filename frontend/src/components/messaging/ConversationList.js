import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { HiChat, HiUser, HiClock } from 'react-icons/hi';

const ConversationList = ({ conversations, onSelectConversation, selectedConversationId }) => {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <HiChat className="h-12 w-12 mb-4 text-gray-300" />
        <p className="text-lg font-medium">No conversations yet</p>
        <p className="text-sm">Start a conversation with fellow alumni</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => {
        const isSelected = selectedConversationId === conversation.conversationId;
        const lastMessage = conversation.lastMessage;
        const otherUser = conversation.otherUser;
        
        return (
          <div
            key={conversation.conversationId}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 cursor-pointer transition-colors ${
              isSelected
                ? 'bg-primary-50 border-r-2 border-primary-600'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {otherUser?.profile?.profilePicture ? (
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={otherUser.profile.profilePicture}
                    alt={otherUser.firstName}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <HiUser className="h-6 w-6 text-gray-500" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {otherUser?.firstName} {otherUser?.lastName}
                  </h3>
                  {lastMessage && (
                    <div className="flex items-center text-xs text-gray-500">
                      <HiClock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                    </div>
                  )}
                </div>
                
                {lastMessage && (
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {lastMessage.content}
                  </p>
                )}
                
                {conversation.unreadCount > 0 && (
                  <div className="flex justify-end mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {conversation.unreadCount} new
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
