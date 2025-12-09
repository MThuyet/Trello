import { ObjectId } from 'mongodb'
import { boardModel } from '~/models/boardModel'

export const boardRoomSocket = (socket) => {
  // Lắng nghe event từ client khi user muốn join vào một board room
  socket.on('FE_JOIN_BOARD_ROOM', async (boardId, userId) => {
    // Validate boardId
    if (!boardId || !userId) {
      socket.emit('BE_JOIN_BOARD_ROOM_FAILED', 'Board ID and User ID are required')
      return
    }

    try {
      const board = await boardModel.findOneById(boardId)
      if (!board) {
        socket.emit('BE_JOIN_BOARD_ROOM_FAILED', 'Board not found')
        return
      }

      const isOwner = board.ownerIds.some((ownerId) => ownerId.equals(new ObjectId(String(userId))))
      const isMember = board.memberIds.some((memberId) => memberId.equals(new ObjectId(String(userId))))

      if (!isOwner && !isMember) {
        socket.emit('BE_JOIN_BOARD_ROOM_FAILED', 'You are not a member of this board')
        return
      }

      // Tạo tên room: board:${boardId}
      const roomName = `board:${boardId}`

      // Join socket này vào room có tên ${roomName}
      socket.join(roomName)
      // Emit lại để confirm với client
      socket.emit('BE_JOINED_BOARD_ROOM', { boardId, roomName })
    } catch (error) {
      socket.emit('BE_JOIN_BOARD_ROOM_FAILED', 'Error joining room')
    }
  })
}
