module.exports = (socketIo, server) => {
  socketIo(server)
  .of('/pages')
  .on("connection", (socket) => {
    socket.on('new-viewer', (data) => {
      socket.join(data.pageId);
      socket.broadcast.to(data.pageId).emit('add-viewer', { userId: data.userId });
    })
    socket.on("disconnect", (id, data) => {
      socket.leaveAll();
      // socket.broadcast.to(data).emit('remove-viewer', { userId: data.userId});
    })
  })
}
