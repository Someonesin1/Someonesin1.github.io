function ProfileSetup({ onComplete }) {
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [customAvatar, setCustomAvatar] = useState(null);
  const fileInputRef = useRef(null);
  
  const avatars = [
    'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f600.png',
    'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f431.png',
    'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f436.png',
    'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f98a.png',
    'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f984.png',
    'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f98d.png',
    'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f981.png',
    'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f43c.png',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nickname.trim()) {
      let avatarUrl = avatars[selectedAvatar];
      
      if (customAvatar) {
        try {
          avatarUrl = await websim.upload(customAvatar);
        } catch (error) {
          console.error('Error uploading avatar:', error);
          return;
        }
      }

      onComplete({
        nickname: nickname.trim(),
        avatar: avatarUrl
      });
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setCustomAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedAvatar(null); // Deselect preset avatars
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-setup">
      <div className="profile-setup-content">
        <h2>Join Chat</h2>
        <form onSubmit={handleSubmit} className="profile-setup-form">
          <div className="avatar-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <button 
              type="button" 
              className="avatar-upload-button"
              onClick={() => fileInputRef.current.click()}
            >
              Upload Custom Avatar
            </button>
            {customAvatar && <span className="custom-avatar-selected"> Custom avatar selected</span>}
          </div>
          <div className="avatar-divider">or choose a preset</div>
          <div className="avatar-options">
            {avatars.map((avatar, index) => (
              <img
                key={index}
                src={avatar}
                className={`avatar-option ${selectedAvatar === index && !customAvatar ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedAvatar(index);
                  setCustomAvatar(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                alt={`Avatar ${index + 1}`}
              />
            ))}
          </div>
          <input
            type="text"
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={32}
            required
          />
          <div style={{ color: '#949ba4', fontSize: '14px', marginTop: '-12px' }}>
            Please use your real name in the nickname so that we don't get it confused
          </div>
          <button type="submit">Join Chat</button>
        </form>
      </div>
    </div>
  );
}

