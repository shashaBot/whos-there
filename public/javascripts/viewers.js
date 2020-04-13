/* eslint-env jquery, browser */

/* global io */

const viewers = {};

const userId = $('#userId').text();
const pageId = window.location.pathname.split('/pages/')[1];

function addViewer(socket, data, notifyNewUser) {
  if (data.user.id !== userId) {
    // only update if other user is not the current user
    if (notifyNewUser) {
      // notify new user of existing (current) user
      socket.emit('already-here', {
        userId,
        pageId
      });
    }
    // add user to viewers list
    viewers[data.user.id] = data.user;
    // update avatar list
    $('#avatar_list_root').attr('data-avatars', JSON.stringify(Object.values(viewers)));
  }
}

function removeViewer(socket, data) {
  // find disconnected user in viewers list and remove
  delete viewers[data.user.id];
  $('#avatar_list_root').attr('data-avatars', JSON.stringify(Object.values(viewers)));
}

$(document).ready(() => {
  const socket = io(`${window.location.hostname}:${window.location.port}/pages`);

  // notify server about new (current) user
  socket.emit('new-viewer', {
    userId,
    pageId: window.location.pathname.split('/pages/')[1]
  });

  // listen for events to update viewers list
  socket.on('add-viewer', (data) => { addViewer(socket, data, true); });
  socket.on('remove-viewer', (data) => { removeViewer(socket, data); });
  socket.on('new-user-update', (data) => { addViewer(socket, data); });
});
