const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const cors = require("cors");
const onConnect = require("./middleware");

app.use(cors());

io.on("connection", onConnect);

server.listen(3001, () => {
  console.log("TO ON PAE");
});
