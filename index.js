const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const { v4: uuidv4 } = require("uuid");
//const _ = require("lodash");

//#region Variables of control
let users = [];
let rooms = [];
//#endregion

io.on("connection", onConnect);

server.listen(3000, () => {
  console.log("TO ON PAE");
});

//#region Connect
const onConnect = (socket) => {
  const { id } = socket.client.conn;
  console.log(`${id} conectou-se ao socket`);

  socket.on("disconnect", () => onDisconnect(id));
  socket.on("joinRoom", (data) => onJoinRoom(data, id, socket));
  socket.on("createRoom", (data) => onCreateRoom(data, id, socket));
  socket.on("playVideo", (data) => onPlayVideo(data, id, socket));
  socket.on("pauseVideo", (data) => onPauseVideo(data, id, socket));
};

//#endregion

//#region Disconnect
const onDisconnect = (id) => {
  console.log(`${id} desconectou-se`);
};
//#endregion

//#region Chat
const onSendMessageToRoom = (socket, room, msg) => {
  socket.to(room).emit("msg", msg);
};
//#endregion

//#region Room
const onCreateRoom = (data, userId, socket) => {
  const { name, roomName } = data;

  const id = uuidv4();

  const newRoom = {
    id,
    name: roomName,
    connections: [userId],
    url: undefined,
  };

  users[userId] = name;
  rooms[id] = newRoom;

  socket.join(id);
  onSendMessageToRoom(id, `${name} entrou na sala`);
};

const onJoinRoom = (data, id, socket) => {
  const { name, roomName } = data;

  users[id] = name;

  if (rooms[roomName] != null) {
    rooms[roomName].connections.push(id);
    socket.join(roomName);
    onSendMessageToRoom(socket, roomName, `${name} entrou na sala`);
  } else {
    onCreateRoom(data, id, socket);
  }
};

//#endregion

//#region Video

const onPlayVideo = (data, userId, socket) => {
  const { roomId, url } = data;
  const username = users[userId];
  socket.to(roomId).emit("playVideo", { url, username });
};

const onPauseVideo = (data, userId, socket) => {
  const { roomId } = data;
  const username = users[userId];
  socket.to(roomId).emit("pauseVideo", username);
};

//#endregion