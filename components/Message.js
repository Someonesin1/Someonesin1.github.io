function Message({ message, reactions, onReaction, activeEmojiPicker, onToggleEmojiPicker, onDelete, currentUser }) {
  const isBot = message.nickname === "Trump Bot 🇺🇸";
  
  return (
    <div key={message.id} className="message" data-is-bot={isBot}>
      <img 
        className="message-avatar" 
        src={message.avatar}
        alt={message.nickname} 
      />
      <div className="message-content">
        <div className="message-header">
          <span className="message-author">{message.nickname}</span>
          <span className="message-time">
            {new Date(message.created_at).toLocaleTimeString()}
          </span>
          <button 
            className="delete-message" 
            onClick={() => onDelete(message.id)}
            title="Delete message"
          >
            <i className="ri-delete-bin-line"></i>
          </button>
        </div>
        {message.content && <div className="message-text">{message.content}</div>}
        {message.imageUrl && (
          <img 
            className="message-image" 
            src={message.imageUrl} 
            alt="Uploaded content"
            onClick={() => window.open(message.imageUrl, '_blank')}
          />
        )}
        <MessageReactions 
          messageId={message.id}
          reactions={reactions}
          onReaction={onReaction}
          activeEmojiPicker={activeEmojiPicker}
          onToggleEmojiPicker={onToggleEmojiPicker}
        />
      </div>
    </div>
  );
}
