// param socket sẽ được lấy từ thư viện socket.io
export const inviteUserToBoardSocket = (socket) => {
  // lắng nghe sự kiện client emit lên có tên: FE_USER_INVITED_TO_BOARD
  socket.on('FE_USER_INVITED_TO_BOARD', (invitation) => {
    // cách làm nhanh và đơn giản nhất: sử dụng broadcast emit ngược lại một sự kiện về cho mọi client khác (ngoại trừ chính thằng gửi request lên), rồi để phía FE check
    socket.broadcast.emit('BE_USER_INVITED_TO_BOARD', invitation)
  })
}
