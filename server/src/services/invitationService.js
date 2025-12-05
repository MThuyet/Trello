import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'
import { boardModel } from '~/models/boardModel'
import { invitationModel } from '~/models/invitationModel'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { BOARD_INVITATION_STATUS, INVITATION_TYPES } from '~/utils/constants'
import { pickUser } from '~/utils/formatters'

const getInvitations = async (userId) => {
  try {
    const getInvitations = await invitationModel.findByUser(userId)

    // vì dữ liệu inviter và invitee chỉ có 1 bảng ghi nhưng lại nằm trong mảng, nên biến đổi về Json Object trước khi trả về phía FE
    const resInvitations = getInvitations.map((i) => ({
      ...i,
      inviter: i.inviter[0] || {},
      invitee: i.invitee[0] || {},
      board: i.board[0] || {},
    }))

    return resInvitations
  } catch (error) {
    throw error
  }
}

const createNewBoardInvitation = async (inviterId, reqBody) => {
  try {
    // người đi mời
    const inviter = await userModel.findOneById(inviterId)
    // người được mời
    const invitee = await userModel.findOneByEmail(reqBody.inviteeEmail)
    // tìm board để lấy ra data xử lý
    const board = await boardModel.findOneById(reqBody.boardId)

    if (!inviter || !invitee || !board) throw new ApiError(StatusCodes.NOT_FOUND, 'Inviter, invitee or board not found!')

    // tạo data cần thiết để lưu vào db
    const newInvitationData = {
      inviterId,
      inviteeId: invitee._id.toString(), // chuyển từ ObjectId về string vì sang bên model có check lại data
      type: INVITATION_TYPES.BOARD_INVITATION,
      boardInvitation: {
        boardId: board._id.toString(),
        status: BOARD_INVITATION_STATUS.PENDING, // mặc định là pending
      },
    }

    // gọi sang model để lưu vào DB
    const createdInvitation = await invitationModel.createNewBoardInvitation(newInvitationData)
    // createdInvitation ko chứa toàn bộ dữ liệu của invitation vừa tạo mà chỉ chứa _id của invitation
    const getInvitation = await invitationModel.findOneById(createdInvitation.insertedId)

    // ngoài thông tin của board invitation mới tạo thì trả về đủ luôn cả board, inviter, invitee cho FE xử lý
    const resInvitation = {
      ...getInvitation,
      board,
      inviter: pickUser(inviter),
      invitee: pickUser(invitee),
    }

    return resInvitation
  } catch (error) {
    throw error // ném tiếp lỗi đã có sẵn (giữ nguyên message, stack trace)
  }
}

const updateBoardInvitation = async (userId, invitationId, status) => {
  try {
    const getInvitation = await invitationModel.findOneById(invitationId)
    if (!getInvitation) throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not found!')

    const boardId = getInvitation.boardInvitation.boardId
    const getBoard = await boardModel.findOneById(boardId)
    if (!getBoard) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')

    // nếu trường hợp status là ACCEPTED join board mà user (invitee) đã là owner hoặc member của board rồi thì lỗi
    const isAlreadyMember = [...getBoard.ownerIds, ...getBoard.memberIds].some((id) => id.equals(new ObjectId(String(userId))))
    if (status === BOARD_INVITATION_STATUS.ACCEPTED && isAlreadyMember)
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You are already a members of this board')

    // tạo dữ liệu để update invitation
    const updateData = {
      boardInvitation: {
        ...getInvitation.boardInvitation,
        status: status,
      },
      updatedAt: Date.now(),
    }

    // cập nhật status trong invitation
    const updatedInvitation = await invitationModel.update(invitationId, updateData)

    // nếu status là ACCEPTED => cập nhật members trong board
    if (updatedInvitation.boardInvitation.status === BOARD_INVITATION_STATUS.ACCEPTED) {
      // Bước 1: Push member vào board trong database
      await boardModel.pushMemberIds(boardId, userId)

      // Bước 2: Lấy thông tin user vừa join để gửi về client
      const newMember = await userModel.findOneById(userId)
      const newMemberData = pickUser(newMember)

      // Bước 3: Emit socket event đến tất cả users trong room có tên ${roomName}
      const roomName = `board:${boardId}`
      if (global.io) {
        global.io.to(roomName).emit('BE_MEMBER_JOINED_BOARD', {
          boardId: boardId,
          newMember: newMemberData,
        })
        console.log(`Emitted BE_MEMBER_JOINED_BOARD to room: ${roomName}`)
      }
    }

    return updatedInvitation
  } catch (error) {
    throw error
  }
}

export const invitationService = {
  createNewBoardInvitation,
  getInvitations,
  updateBoardInvitation,
}
