const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormBtn = $messageForm.querySelector('button')
const $locationBtn = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')

// template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const userListTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    if ($messages && $messages.lastElementChild) {
        $messages.lastElementChild.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }
}

socket.on("welcomeMessage", (msg) => {
    console.log(msg);
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(userListTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

document.querySelector('#sendLocation').addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported in your browser')
        return;
    }

    $locationBtn.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        if (position.coords && position.coords.latitude && position.coords.longitude) {

            socket.emit("location", { latitude: position.coords.latitude, longitude: position.coords.longitude }, () => {
                $locationBtn.removeAttribute('disabled')
                console.log("Location sent");
            })
        } else {
            $locationBtn.removeAttribute('disabled')
        }
    })
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault()

    const msg = document.querySelector('input').value;
    if (msg) {
        $messageFormBtn.setAttribute('disabled', 'disabled')
        socket.emit('sendMessage', msg, (error) => {
            $messageFormBtn.removeAttribute('disabled')
            $messageFormInput.value = ''
            $messageFormInput.focus()
            if (error) {
                return console.log(error);
            }

            console.log("Message delivered");
        });
    }
})

socket.on('receiveMessage', (msg) => {
    console.log(msg);
    const html = Mustache.render(messageTemplate, { username: msg.username, message: msg.text, timestamp: moment(msg.createdAt).format("DD/MM/YY hh:mm a") })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('receiveLocation', (url) => {
    console.log(url);
    const html = Mustache.render(locationMessageTemplate, { username: url.username, url: url.text, timestamp: moment(url.createdAt).format("DD/MM/YY hh:mm a") })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('disconnect', (msg) => {
    console.log(msg.text);
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/"
    }
})