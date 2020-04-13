/* eslint-env jquery, browser */

function updateAvatars(rootEl) {
  const {
    nameField, imgField, avatarClass
  } = rootEl.dataset;
  const avatars = JSON.parse(rootEl.dataset.avatars);
  rootEl.innerHTML = '';
  avatars.forEach((avatar) => {
    const avatarEl = document.createElement('a');
    avatarEl.id = avatar.id;
    avatarEl.className = avatarClass;
    avatarEl.style.backgroundImage = `url(${avatar[imgField]})`;
    avatarEl.setAttribute('username', avatar[nameField]);
    rootEl.append(avatarEl);
  });
}

function avatarListUpdated(mutationsList) {
  mutationsList.forEach((m) => {
    if (m.type === 'attributes') {
      if (m.attributeName === 'data-avatars') {
        updateAvatars(m.target);
      }
    }
  });
}

$(document).ready(() => {
  const root = document.getElementById('avatar_list_root');
  updateAvatars(root);
  const observer = new MutationObserver(avatarListUpdated);
  observer.observe(root, {
    attributes: true
  });
});
