const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
});

let myvideostream;
const userName = prompt("Enter your name:");

const myvideo = document.createElement('video');
myvideo.muted = true;
const peers = {};

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myvideostream = stream;
  addVideostream(myvideo, stream);

  myPeer.on('call', call => {
    call.answer(stream);
   
    const video = document.createElement('video');
    call.on('stream', uservideostream => {
      addVideostream(video, uservideostream);
    });
  });

  socket.on('user-connected', (userId, userName) => {
    connectToNewUser(userId, stream, userName);
  });

  // input value
  let text = $("input");
  // when press enter send message
  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val());
      text.val('');
    }
  });
  socket.on("createMessage", (message, userName) => {
    $("ul").append(`<li class="message"><b>${userName}</b><br/>${message}</li>`);
  });
});

socket.on('user-disconnected', userId => {
  if (peers[userId]) {
    peers[userId].close();
    delete peers[userId];
  }
});

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id, userName);
});

function connectToNewUser(userId, stream, userName) {
  const call = myPeer.call(userId, stream);
 
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    console.log(userVideoStream)
    addVideostream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  });
  peers[userId] = call;
}

function addVideostream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

const muteUnmute = () => {
  const enabled = myvideostream.getAudioTracks()[0].enabled;
  myvideostream.getAudioTracks()[0].enabled = !enabled;
  setAudioButtonState(!enabled);
};

const playStop = () => {
  const enabled = myvideostream.getVideoTracks()[0].enabled;
  myvideostream.getVideoTracks()[0].enabled = !enabled;
  setVideoButtonState(!enabled);
};

function leaveMeet() {
  var backlen = history.length;
  history.go(-backlen);
  window.location.href = '/';
}
const setAudioButtonState = (enabled) => {
  const html = enabled
    ? '<i class="fas fa-microphone"></i><span>Mute</span>'
    : '<i class="unmute fas fa-microphone-slash"></i><span>Unmute</span>';
  document.querySelector('.main__mute_button').innerHTML = html;
};

const setVideoButtonState = (enabled) => {
  const html = enabled
    ? '<i class="fas fa-video"></i><span>Stop Video</span>'
    : '<i class="stop fas fa-video-slash"></i><span>Play Video</span>';
  document.querySelector('.main__video_button').innerHTML = html;
};


const chatWindow = document.querySelector('.main__right')
const videoWindow = document.querySelector('.main__left')
function showHideChat() {
    if (chatWindow.style.display === 'none') {
        videoWindow.style.flex = 0.8;
        chatWindow.style.flex = 0.2;
        chatWindow.style.display = 'flex';
    } else {
        videoWindow.style.flex = 1.0;
        chatWindow.style.display = 'none';
    }
}