function updateAvatars(rootEl) {
  let { avatars, nameField, imgField, avatarClass } = rootEl.dataset;
  avatars = JSON.parse(avatars);
  rootEl.innerHTML = "";
  for (let avatar of avatars) {
    console.log('avatar', avatar);
    let avatarEl = document.createElement('a');
    avatarEl.className = avatarClass;
    avatarEl.style.backgroundImage = "url(" + avatar[imgField] + ")";
    avatarEl.setAttribute('username', avatar[nameField]);
    rootEl.append(avatarEl);
  }
}

function avatarListUpdated(mutationsList) {
  console.log('mutation: ', mutationsList)
  for(let m of mutationsList) {
    if(m.type === 'attributes') {
      if (m.attributeName === 'data-avatars') {
        updateAvatars(m.target)
      }
    }
  }
}

(function () {
  let root = document.getElementById('avatar_list_root');
  let observer = new MutationObserver(avatarListUpdated);
  observer.observe(root, {
    attributes: true
  })
})();