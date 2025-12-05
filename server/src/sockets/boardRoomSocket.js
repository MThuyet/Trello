export const boardRoomSocket = (socket) => {
  // Lắng nghe event từ client khi user muốn join vào một board room
  socket.on('FE_JOIN_BOARD_ROOM', (boardId) => {
    // Validate boardId
    if (!boardId) {
      socket.emit('BE_JOIN_BOARD_ROOM_FAILED', 'Board ID is required')
      return
    }

    // Tạo tên room: board:${boardId}
    const roomName = `board:${boardId}`

    // Join socket này vào room có tên ${roomName}
    socket.join(roomName)
    console.log(`User ${socket.id} joined room: ${roomName}`)

    // Emit lại để confirm với client
    socket.emit('BE_JOINED_BOARD_ROOM', { boardId, roomName })
  })
}
