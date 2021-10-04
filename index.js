//requires
const express = require("express");
const app = express();
const fs = require('fs');
const http = require("http").Server({
  key:fs.readFileSync('/www/server/panel/vhost/cert/ssrddevelopment.com/privkey.pem','utf8'),
  cert:fs.readFileSync('/www/server/panel/vhost/cert/ssrddevelopment.com/fullchain.pem','utf8')
},app);
const io = require("socket.io")(http);

const port = process.env.PORT || 3000;

let broadcasters = {};

// express routing
app.use(express.static("public"));
app.use(express.static("public/viewer.html"));


app.get('/viewer',(req,res)=>{
    res.send('');
})

// signaling
io.on("connection", function (socket) {
  console.log("a user connected");

  socket.on("register as broadcaster", function (room) {
    console.log("register as broadcaster for room", room);

    broadcasters[room] = socket.id;

    socket.join(room);
  });

  socket.on("register as viewer", function (user) {
    console.log("register as viewer for room", user.room);

    socket.join(user.room);
    user.id = socket.id;

    socket.to(broadcasters[user.room]).emit("new viewer", user);
  });

  socket.on("candidate", function (id, event) {
    socket.to(id).emit("candidate", socket.id, event);
  });

  socket.on("offer", function (id, event) {
    event.broadcaster.id = socket.id;
    socket.to(id).emit("offer", event.broadcaster, event.sdp);
  });

  socket.on("answer", function (event) {
    socket.to(broadcasters[event.room]).emit("answer", socket.id, event.sdp);
  });
});

// listener
http.listen(port || 3000, function () {
  console.log("listening on", port);
});
