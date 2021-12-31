const users = []

const addUser = ({id, username, room}) => {
    username = username.trim()
    room = room.trim()

    if(!username || !room){
        return {error: "Username and room is required!"}
    }

    // Check if user already exists
    const exists = users.find((user) => user.room == room && user.username == username)
    if(exists){
        return {error: "Username already in use!"}
    }

    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex( f => f.id == id);
    if(index !== -1){
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find( f => f.id == id);
}

const getUsersInRoom = (room) => {
    return users.filter(f => f.room == room.trim())
}

module.exports = {
    getUsersInRoom,
    getUser,
    removeUser,
    addUser
}