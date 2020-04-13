const User = require('./models/User');

/**
 * There are issues with using socketio with async/await
 * https://github.com/socketio/socket.io/issues/3431
 * So, we'll stick with callbacks for socket.io
 */

function getUserDetails(user) {
  return {
    id: user.id,
    name: user.profile.name || user.email,
    picture: user.profile.picture || user.gravatar(100)
  };
}

module.exports = (socketIo, server) => {
  const nsp = socketIo(server).of('/pages');
  nsp
    .on('connection', (socket) => {
      socket.on('new-viewer', (data) => {
        socket.join(data.pageId);
        User.findByIdAndUpdate(data.userId, { socketId: socket.id }, { new: true }, (err, user) => {
          if (err) throw err;
          if (!user) return;
          socket.broadcast.to(data.pageId).emit('add-viewer', { user: getUserDetails(user) });
        });
      });
      socket.on('already-here', (data) => {
        User.findById(data.userId, (err, user) => {
          if (err) throw err;
          if (!user) return;
          socket.broadcast.to(data.pageId).emit('new-user-update', { user: getUserDetails(user) });
        });
      });
      socket.on('disconnect', () => {
        User.findOneAndUpdate({ socketId: socket.id }, { socketId: null }, { new: false },
          (err, user) => {
            if (err) throw err;
            if (!user) return;
            socket.broadcast.emit('remove-viewer', {
              user: {
                id: user.id
              }
            });
          });
      });
    });
};
