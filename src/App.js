import React, { useState, useEffect } from "react";

function RounderApp() {
  const [audioPosts, setAudioPosts] = useState([]); // List of audio and video posts
  const [recording, setRecording] = useState(false); // Recording state
  const [audioURL, setAudioURL] = useState(null); // URL of the recorded audio or video
  const [mediaRecorder, setMediaRecorder] = useState(null); // MediaRecorder instance
  const [replyingTo, setReplyingTo] = useState(null); // ID of the post being replied to
  const [recordingTime, setRecordingTime] = useState(0); // Timer for recording
  const [isVideoMode, setIsVideoMode] = useState(false); // Toggle for audio/video mode
  const [showSettings, setShowSettings] = useState(false); // Show or hide settings modal
  const [notifications, setNotifications] = useState([]); // Notifications for replies
  const [showNotifications, setShowNotifications] = useState(false); // Show or hide notification dropdown
  const [isSafari, setIsSafari] = useState(false); // Detect if the browser is Safari
  const [audioContext, setAudioContext] = useState(null); // Web Audio API context for Safari fallback
  const [audioChunks, setAudioChunks] = useState([]); // Audio chunks for Safari fallback
  const [mediaStream, setMediaStream] = useState(null); // Media stream for Safari fallback
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null); // Current logged-in user
  const [users, setUsers] = useState([
    { username: "niko", login: "admin", password: "password" },
    { username: "abdul", login: "admin2", password: "password" },
  ]); // List of registered users
  const [showSignUp, setShowSignUp] = useState(false); // Show or hide sign-up form
  const [newLogin, setNewLogin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");

  // Detect if the browser is Safari or WebKit-based (e.g., Chrome on iPhone)
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const safari = /^((?!chrome|android).)*safari/i.test(userAgent);
    setIsSafari(safari);

    if (safari) {
      console.log("Detected Safari or WebKit-based browser.");
      alert(
        "You are using a WebKit-based browser. Some features may be adjusted for compatibility."
      );
    }
  }, []);

  // Timer effect for recording
  useEffect(() => {
    let timer;
    if (recording) {
      timer = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [recording]);

  // Login function
  const handleLogin = () => {
    const user = users.find(
      (u) => u.login === username && u.password === password
    );
    if (user) {
      setIsLoggedIn(true);
      setCurrentUser(user.username);
      alert(`Welcome, ${user.username}!`);
    } else {
      alert("Invalid login or password.");
    }
  };

  // Logout function
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    setCurrentUser(null);
    alert("You have been logged out.");
  };

  // Sign-Up function
  const handleSignUp = () => {
    if (!newLogin || !newPassword || !newUsername) {
      alert("Please fill in all fields.");
      return;
    }

    const existingUser = users.find((u) => u.login === newLogin);
    if (existingUser) {
      alert("This login is already taken. Please choose another.");
      return;
    }

    const newUser = {
      username: newUsername,
      login: newLogin,
      password: newPassword,
    };
    setUsers((prevUsers) => [...prevUsers, newUser]);
    alert("Sign-up successful! You can now log in.");
    setShowSignUp(false);
    setNewLogin("");
    setNewPassword("");
    setNewUsername("");
  };

  const startRecording = async () => {
    if (!isLoggedIn) {
      alert("You must be logged in to record.");
      return;
    }

    try {
      const constraints = isVideoMode
        ? { audio: true, video: true } // Video mode
        : { audio: true }; // Audio-only mode

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      const localChunks = [];

      recorder.ondataavailable = (event) => {
        localChunks.push(event.data);
      };

      recorder.onstop = () => {
        const blobType = isVideoMode ? "video/mp4" : "audio/mp3";
        const blob = new Blob(localChunks, { type: blobType });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
      };

      recorder.start();
      setRecording(true);
      setRecordingTime(0); // Reset the timer
    } catch (error) {
      alert(
        "Could not access your microphone or camera. Please check your permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    setRecording(false);
  };

  const uploadAudio = () => {
    if (audioURL) {
      const newPost = {
        id: Date.now(),
        url: audioURL,
        timestamp: new Date().toLocaleString(),
        likes: [],
        dislikes: [],
        replies: [],
        isVideo: isVideoMode,
        author: currentUser,
      };

      if (replyingTo) {
        setAudioPosts((prevPosts) =>
          addReplyToPost(prevPosts, replyingTo, newPost)
        );
        setReplyingTo(null);
      } else {
        setAudioPosts((prevPosts) => [newPost, ...prevPosts]);
      }

      setAudioURL(null);
    }
  };

  const addReplyToPost = (posts, postId, reply) => {
    return posts.map((post) => {
      if (post.id === postId) {
        return { ...post, replies: [...post.replies, reply] };
      } else if (post.replies.length > 0) {
        return {
          ...post,
          replies: addReplyToPost(post.replies, postId, reply),
        };
      }
      return post;
    });
  };

  const deletePost = (postId) => {
    const deleteFromPosts = (posts) => {
      return posts
        .filter((post) => post.id !== postId)
        .map((post) => ({
          ...post,
          replies: deleteFromPosts(post.replies),
        }));
    };

    setAudioPosts((prevPosts) => deleteFromPosts(prevPosts));
  };

  const handleLike = (postId) => {
    setAudioPosts((prevPosts) =>
      prevPosts.map((post) =>
        updateLikesOrDislikes(post, postId, "like", currentUser)
      )
    );
  };

  const handleDislike = (postId) => {
    setAudioPosts((prevPosts) =>
      prevPosts.map((post) =>
        updateLikesOrDislikes(post, postId, "dislike", currentUser)
      )
    );
  };

  const updateLikesOrDislikes = (post, postId, action, user) => {
    if (post.id === postId) {
      if (action === "like" && !post.likes.includes(user)) {
        return {
          ...post,
          likes: [...post.likes, user],
          dislikes: post.dislikes.filter((u) => u !== user),
        };
      } else if (action === "dislike" && !post.dislikes.includes(user)) {
        return {
          ...post,
          dislikes: [...post.dislikes, user],
          likes: post.likes.filter((u) => u !== user),
        };
      }
    } else if (post.replies.length > 0) {
      return {
        ...post,
        replies: post.replies.map((reply) =>
          updateLikesOrDislikes(reply, postId, action, user)
        ),
      };
    }
    return post;
  };

  const renderPosts = (posts, depth = 0) => {
    return posts.map((post) => (
      <li key={post.id} style={{ marginLeft: depth * 20 + "px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p>
            <strong>{post.author}</strong> at {post.timestamp}
          </p>
          <button
            onClick={() => deletePost(post.id)}
            style={{
              background: "none",
              border: "none",
              color: "red",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
        {post.isVideo ? (
          <video controls src={post.url} style={{ width: "100%" }}></video>
        ) : (
          <audio controls src={post.url} style={{ width: "100%" }}></audio>
        )}
        <div>
          <button
            onClick={() => handleLike(post.id)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            👍 {post.likes.length}
          </button>
          <button
            onClick={() => handleDislike(post.id)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            👎 {post.dislikes.length}
          </button>
          <button onClick={() => setReplyingTo(post.id)}>Reply</button>
        </div>
        {post.replies.length > 0 && (
          <ul>{renderPosts(post.replies, depth + 1)}</ul>
        )}
      </li>
    ));
  };

  return (
    <div
      style={{
        backgroundColor: "#4B0082",
        color: "#fff",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <h1 style={{ fontSize: "33px", margin: 0 }}>rounder</h1>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              marginLeft: "10px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            🔔
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              marginLeft: "10px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            ⚙️
          </button>
        </div>
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#ff4d4d",
              color: "#fff",
              padding: "10px",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Logout
          </button>
        ) : (
          <div>
            <input
              type="text"
              placeholder="Login"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ marginRight: "10px" }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginRight: "10px" }}
            />
            <button
              onClick={handleLogin}
              style={{
                backgroundColor: "#4CAF50",
                color: "#fff",
                padding: "10px",
                border: "none",
                borderRadius: "5px",
              }}
            >
              Login
            </button>
            <button
              onClick={() => setShowSignUp(true)}
              style={{
                marginLeft: "10px",
                backgroundColor: "#007BFF",
                color: "#fff",
                padding: "10px",
                border: "none",
                borderRadius: "5px",
              }}
            >
              Sign Up
            </button>
          </div>
        )}
      </header>

      {showSignUp && (
        <div
          style={{
            backgroundColor: "#fff",
            color: "#000",
            padding: "20px",
            borderRadius: "5px",
            marginTop: "20px",
          }}
        >
          <h2>Sign Up</h2>
          <input
            type="text"
            placeholder="Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            style={{ display: "block", marginBottom: "10px", width: "100%" }}
          />
          <input
            type="text"
            placeholder="Login"
            value={newLogin}
            onChange={(e) => setNewLogin(e.target.value)}
            style={{ display: "block", marginBottom: "10px", width: "100%" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ display: "block", marginBottom: "10px", width: "100%" }}
          />
          <button
            onClick={handleSignUp}
            style={{
              backgroundColor: "#4CAF50",
              color: "#fff",
              padding: "10px",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Sign Up
          </button>
          <button
            onClick={() => setShowSignUp(false)}
            style={{
              marginLeft: "10px",
              backgroundColor: "#ff4d4d",
              color: "#fff",
              padding: "10px",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {showNotifications && (
        <div
          style={{
            backgroundColor: "#fff",
            color: "#000",
            padding: "10px",
            borderRadius: "5px",
            marginTop: "10px",
          }}
        >
          <p>No notifications yet.</p>
        </div>
      )}

      {showSettings && (
        <div
          style={{
            backgroundColor: "#fff",
            color: "#000",
            padding: "10px",
            borderRadius: "5px",
            marginTop: "10px",
          }}
        >
          <p>Settings will be implemented soon.</p>
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={recording ? stopRecording : startRecording}
          style={{
            padding: "10px 20px",
            backgroundColor: recording ? "#ff4d4d" : "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
          }}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>
        <div style={{ marginTop: "10px" }}>
          <label>
            <input
              type="radio"
              name="mode"
              value="audio"
              checked={!isVideoMode}
              onChange={() => setIsVideoMode(false)}
            />
            Audio
          </label>
          <label style={{ marginLeft: "10px" }}>
            <input
              type="radio"
              name="mode"
              value="video"
              checked={isVideoMode}
              onChange={() => setIsVideoMode(true)}
            />
            Video
          </label>
        </div>
      </div>

      {audioURL && (
        <div style={{ marginTop: "20px" }}>
          {isVideoMode ? (
            <video controls src={audioURL} style={{ width: "100%" }}></video>
          ) : (
            <audio controls src={audioURL} style={{ width: "100%" }}></audio>
          )}
          <button
            onClick={uploadAudio}
            style={{
              marginTop: "10px",
              padding: "10px 20px",
              backgroundColor: "#007BFF",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Upload
          </button>
        </div>
      )}

      <ul style={{ marginTop: "20px" }}>{renderPosts(audioPosts)}</ul>
    </div>
  );
}

export default RounderApp;
