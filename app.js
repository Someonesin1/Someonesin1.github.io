const room = new WebsimSocket();
const { useState, useEffect, useRef } = React;

function App() {
  const [profile, setProfile] = useState(null);
  const messages = React.useSyncExternalStore(
    room.collection('message').subscribe,
    () => room.collection('message').getList() || []
  );

  const reactions = React.useSyncExternalStore(
    room.collection('reaction').subscribe,
    () => room.collection('reaction').getList() || []
  );

  const [newMessage, setNewMessage] = useState('');
  const [activeEmojiPicker, setActiveEmojiPicker] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [isChatbotTyping, setChatbotTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const emojiPickers = document.querySelectorAll('.emoji-picker');
      let clickedInside = false;
      emojiPickers.forEach(picker => {
        if (picker.contains(event.target)) clickedInside = true;
      });
      if (!clickedInside) setActiveEmojiPicker(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    try {
      let imageUrl = null;
      if (selectedImage) {
        setUploadingImage(true);
        imageUrl = await websim.upload(selectedImage);
      }

      const isAIChatbot = newMessage.startsWith('/ai ');
      if (isAIChatbot) {
        const userQuestion = newMessage.slice(4);
        
        // Add user message
        const userMessage = {
          content: userQuestion,
          nickname: profile.nickname,
          avatar: profile.avatar
        };
        const createdUserMsg = await room.collection('message').create(userMessage);

        // Show typing indicator
        setChatbotTyping(true);

        // Update conversation history
        const newHistory = [...conversationHistory, {
          role: "user",
          content: userQuestion
        }].slice(-10);

        // Get AI response
        try {
          const completion = await websim.chat.completions.create({
            messages: [
              {
                role: "system",
                content: "You are Donald Trump. Respond in his characteristic style - short, punchy sentences, use words like 'tremendous', 'huge', 'amazing'. Keep responses under 2-3 sentences. End many statements with exclamation marks! Use ALL CAPS sometimes for emphasis."
              },
              ...newHistory
            ]
          });

          setConversationHistory(newHistory);

          // Add AI response message
          await room.collection('message').create({
            content: completion.content,
            nickname: "Trump Bot ",
            avatar: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f1fa-1f1f8.png"
          });
        } catch (error) {
          console.error('AI Error:', error);
        } finally {
          setChatbotTyping(false);
        }
      } else {
        // Normal message handling
        await room.collection('message').create({
          content: newMessage.trim(),
          imageUrl: imageUrl,
          nickname: profile.nickname,
          avatar: profile.avatar
        });
      }

      setNewMessage('');
      setSelectedImage(null);
      setSelectedImagePreview(null);
      setUploadingImage(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddReaction = async (messageId, emoji, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      const existingReaction = reactions.find(
        r => r.message_id === messageId && 
             r.emoji === emoji && 
             r.nickname === profile.nickname
      );

      if (existingReaction) {
        await room.collection('reaction').delete(existingReaction.id);
      } else {
        await room.collection('reaction').create({
          message_id: messageId,
          emoji: emoji,
          nickname: profile.nickname
        });
      }
    } catch (error) {
      console.error('Error managing reaction:', error);
    }
    setActiveEmojiPicker(null);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      // Delete message
      await room.collection('message').delete(messageId);
      
      // Delete associated reactions
      const messageReactions = reactions.filter(r => r.message_id === messageId);
      for (const reaction of messageReactions) {
        await room.collection('reaction').delete(reaction.id);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const getMessageReactions = (messageId) => {
    const messageReactions = reactions.filter(r => r.message_id === messageId);
    return messageReactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          count: 0,
          users: [],
          hasReacted: false
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.nickname);
      if (reaction.nickname === profile?.nickname) {
        acc[reaction.emoji].hasReacted = true;
      }
      return acc;
    }, {});
  };

  if (!profile) {
    return <ProfileSetup onComplete={setProfile} />;
  }

  return (
    <div className="app">
      <ChatHeader />
      <div className="chat-messages">
        {sortedMessages.map(message => (
          <Message
            key={message.id}
            message={message}
            reactions={getMessageReactions(message.id)}
            onReaction={handleAddReaction}
            activeEmojiPicker={activeEmojiPicker}
            onToggleEmojiPicker={(messageId, e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveEmojiPicker(activeEmojiPicker === messageId ? null : messageId);
            }}
            onDelete={handleDeleteMessage}
            currentUser={profile}
          />
        ))}
        {isChatbotTyping && (
          <div className="chatbot-typing">
            Trump Bot is typing<span className="typing-dots">...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        newMessage={newMessage}
        onMessageChange={setNewMessage}
        onSubmit={handleSendMessage}
        onFileSelect={handleFileSelect}
        uploadingImage={uploadingImage}
        selectedImagePreview={selectedImagePreview}
        onRemoveImage={() => {
          setSelectedImage(null);
          setSelectedImagePreview(null);
          fileInputRef.current.value = '';
        }}
        fileInputRef={fileInputRef}
      />
      <div className="chatbot-hint">
        Type /ai followed by your message to ask Trump Bot a question!
      </div>
    </div>
  );
}
