const { v4: uuidv4 } = require("uuid");

//#region Variables of control
var users = {};
var rooms = {};
//#endregion

//#region Disconnect
const onDisconnect = (userId, socket) => {
  console.log(`${userId} desconectou-se`);
  tryLeaveRoom(userId, socket);
  socket.removeAllListeners();
};

const tryLeaveRoom = (userId, socket) => {
  Object.keys(rooms).map((key) => {
    if (rooms[key].connections.some((id) => id == userId)) {
      rooms[key].connections = rooms[key].connections.filter(
        (id) => id != userId
      );
      const dto = getRoomDto(key);
      socket.to(key).emit("roomUpdate", dto);
    }
  });
};

//#endregion

//#region Chat
const onSendMessageToRoom = ({ userId, socket, text, room }) => {
  const username = users[userId];

  const newMessage = {
    text,
    userId,
    username,
  };

  socket.to(room).emit("msg", newMessage);
  socket.emit("msg", newMessage);
};
//#endregion

//#region Room
const onCreateRoom = (data, userId, socket) => {
  const { name, roomName } = data;

  const roomId = uuidv4();

  const newRoom = {
    name: roomName,
    connections: [userId],
    url: undefined,
  };

  users[userId] = name;
  rooms[roomId] = newRoom;

  socket.join(roomId);
  onSendMessageToRoom({
    userId,
    socket,
    room: roomId,
    text: `${name} entrou na sala`,
  });
  const dto = getRoomDto(roomId);
  socket.to(roomId).emit("roomUpdate", dto);
  socket.emit("roomUpdate", dto);
};

const onJoinRoom = (data, userId, socket) => {
  const { name, roomName } = data;

  users[userId] = name;

  if (rooms[roomName] != null) {
    if (rooms[roomName].connections.some((id) => id == userId)) return;
    rooms[roomName].connections.push(userId);
    socket.join(roomName);
    onSendMessageToRoom({
      socket,
      userId,
      room: roomName,
      text: `${name} entrou na sala`,
    });
    const dto = getRoomDto(roomName);
    socket.to(roomName).emit("roomUpdate", dto);
    socket.emit("roomUpdate", dto);
  } else {
    onCreateRoom(data, userId, socket);
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

//#region Utils

const getRoomDto = (roomId) => {
  const room = rooms[roomId];
  return {
    id: roomId,
    usersCount: room.connections.length,
    url: room.url,
    name: room.name,
  };
};

//#endregion

//#region Connect
const onConnect = (socket) => {
  // const { id } = socket.client.conn;
  const { id } = socket;
  console.log(`${id} conectou-se ao socket`);
  socket.on("disconnect", () => onDisconnect(id, socket));
  socket.on("joinRoom", (data) => onJoinRoom(data, id, socket));
  socket.on("createRoom", (data) => onCreateRoom(data, id, socket));
  socket.on("playVideo", (data) => onPlayVideo(data, id, socket));
  socket.on("pauseVideo", (data) => onPauseVideo(data, id, socket));
  socket.on("sendMessage", (data) =>
    onSendMessageToRoom({ userId: id, socket, ...data })
  );
};

//#endregion

module.exports = onConnect;
