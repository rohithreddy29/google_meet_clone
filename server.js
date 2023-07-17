const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
//const { v4: uuidV4 } = require('uuid');

const path = require('path');


app.set('view engine', 'ejs');
app.use(express.static('public'));

function uuidV4() {
  return 'xxyxyxxyx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}


// Passport and session setup
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Configure Passport
const GOOGLE_CLIENT_ID = '430156421426-t3eft50mt2t9prg6aa2dhsqq7950hqbm.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET='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';
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, cb) => {
  // This is where you can handle the user data returned by Google
  // You can store the user in your database or perform any other actions
  // You can access the user profile data via the `profile` object

  // Call the callback function with the user object
  return cb(null, profile);
}));

passport.serializeUser((user, done) => {
  // Serialize the user object (e.g., store the user ID in the session)
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // Deserialize the user object (e.g., retrieve the user from the database based on the ID)
  const user = { id }; // Replace this with your logic to retrieve the user
  done(null, user);
});

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

function isLoggedIn(req, res, next) {
  req.user ? next() : res.redirect('/start');
}

// Routes
app.get('/start', (req, res) => {
  res.redirect('/auth/google');
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Authentication successful, redirect to the room creation page
    res.redirect('/');
  }
);

app.get('/', isLoggedIn,(req, res) => {
  res.render('home');
});

app.post('/room', isLoggedIn,(req, res) => {
  const roomID = uuidV4();
  res.redirect(`/${roomID}`);
});

app.get('/:room', isLoggedIn,(req, res) => {
  res.render('room', { roomId: req.params.room });
});

// WBC

app.get('/whiteboard/:id', isLoggedIn,(req, res) => {
  const roomId = req.params.id;
  res.render('whiteboard', { roomId }); 
});




// app.use(express.static("public"));

// let PORT = process.env.PORT || 3000;
// httpServer.listen(PORT, () =>console.log(`Server started on port ${PORT}`));

let connections = [];
// Ends here

// WBC
// let connections = []

io.on('connect' , (socket) => {
  connections.push(socket);
  console.log(`${socket.id} has connected`);

  socket.on('draw' , (data) =>{
      connections.forEach(con =>{
          if(con.id !== socket.id){
              con.emit('ondraw' , {x :data.x ,y: data.y})
          }
      })
  })

  socket.on('down' , (data) =>{
      connections.forEach(con =>{
          if(con.id!==socket.id){
              con.emit('ondown', {x : data.x , y : data.y});
          }
      });
  });

  socket.on("disconnect" , (reason) => {
      console.log(`${socket.id} is disconnected`);
      connections = connections.filter((con) =>con.id != socket.id);
  });
});

//ends here
io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId, userName) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-connected', userId, userName);
    
    socket.on('message', (message) => {
      io.to(roomId).emit('createMessage', message, userName);
    });

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId, userName);
    });
  });
});



server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

