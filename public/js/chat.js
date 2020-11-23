const socket = io();

const $messageForm = document.querySelector('#chatForm');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#sendLocation');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

const messageTemplate = document.querySelector('#messageTemplate').innerHTML;
const locationTemplate = document.querySelector('#locationTemplate').innerHTML;
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoScroll = () => {
  const $newMessage = $messages.lastElementChild;
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageHeight = $newMessage.offsetHeight + parseInt(newMessageStyles.marginBottom);

  const visibleHeight = $messages.offsetHeight;
  const containerHeight = $messages.scrollHeight;
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if(containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
}

socket.on('message', (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('H:mm')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
})

socket.on('locationMessage', (message) => {
  console.log(message);
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('H:mm')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  $sidebar.innerHTML = ('beforeend', html);
})

$messageForm.addEventListener('submit', (event) => {

  event.preventDefault();
  $messageFormButton.setAttribute('disabled', 'disabled');

  let message = event.target.elements.message.value;

  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();
    if(error) return console.log(error);
  });
  console.log('Message delivered');
});

$locationButton.addEventListener('click', () => {
  if(!navigator.geolocation){
    return alert('Geolocation is not supported by your browser.');
  }

  $locationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude, 
      longitude: position.coords.longitude
    }, () => {
      $locationButton.removeAttribute('disabled');
      console.log('Location shared!');
    });
  });
})

socket.emit('join', { username, room }, (error) => {
  if(error) {
    alert(error);
    location.href = '/';
  }
});