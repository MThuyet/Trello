import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'
import { boardModel } from '~/models/boardModel'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import ApiError from '~/utils/ApiError'

/**
 * Helper function để kiểm tra quyền truy cập board
 */
const checkBoardPermission = async (boardId, userId) => {
  const board = await boardModel.findOneById(boardId)
  if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found')

  const userObjectId = new ObjectId(String(userId))
  const isOwner = board.ownerIds.some((ownerId) => ownerId.equals(userObjectId))
  const isMember = board.memberIds.some((memberId) => memberId.equals(userObjectId))

  if (!isOwner && !isMember) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access this board')
  }

  return board
}

const createNew = async (reqBody, userId) => {
  try {
    const createdCard = await cardModel.createNew(reqBody)

    const getNewCard = await cardModel.findOneById(createdCard.insertedId)

    if (getNewCard) {
      await columnModel.pushCardOrderIds(getNewCard)

      if (global.io) {
        const roomName = `board:${getNewCard.boardId.toString()}`
        global.io.to(roomName).emit('BE_NEW_CARD_CREATED', {
          ...getNewCard,
          createdBy: userId.toString(),
        })
      }

      return getNewCard
    }
  } catch (error) {
    throw error
  }
}

const update = async (cardId, reqBody, cardCoverFile, userInfor) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now(),
    }

    let updatedCard = {}

    if (cardCoverFile) {
      // trường hợp upload cover file
      const uploadResult = await CloudinaryProvider.streamUpload(cardCoverFile.buffer, 'cards')
      updatedCard = await cardModel.update(cardId, {
        cover: uploadResult.secure_url,
      })
    } else if (updateData.commentToAdd) {
      // tạo dữ liệu comment để thêm vô db (bổ sung thêm những field cần thiết)
      const commentData = {
        _id: new ObjectId(),
        ...updateData.commentToAdd,
        commentedAt: Date.now(),
        userId: userInfor._id,
        userEmail: userInfor.email,
      }

      // thêm comment mới vào đầu mảng comments
      updatedCard = await cardModel.unShiftNewComment(cardId, commentData)
    } else if (updateData.incomingMemberInfo) {
      // trường hợp add hoặc remove member on card
      updatedCard = await cardModel.updateMembers(cardId, updateData.incomingMemberInfo)
    } else if (updateData.commentToDelete) {
      // xóa comment - dùng atomic operation với điều kiện
      updatedCard = await cardModel.pullOneComment(cardId, updateData.commentToDelete)

      // Nếu result null thì card hoặc comment không tồn tại
      if (!updatedCard) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Card or comment not found!')
      }
    } else {
      // các trường hợp update thông tin chung (title, description)
      updatedCard = await cardModel.update(cardId, updateData)
    }

    // Emit socket event khi card được update
    if (updatedCard && global.io) {
      const roomName = `board:${updatedCard.boardId.toString()}`
      global.io.to(roomName).emit('BE_CARD_UPDATED', {
        ...updatedCard,
        updatedBy: userInfor._id.toString(),
      })
    }

    return updatedCard
  } catch (error) {
    throw error
  }
}

const deleteOne = async (cardId, userId) => {
  try {
    const card = await cardModel.findOneById(cardId)
    if (!card) throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found!')

    await columnModel.pullCardOrderIds(card)
    const deleteResult = await cardModel.deleteOneById(cardId)

    if (deleteResult.deletedCount > 0 && global.io) {
      const roomName = `board:${card.boardId}`
      global.io.to(roomName).emit('BE_DELETED_CARD', {
        cardId: card._id.toString(),
        boardId: card.boardId.toString(),
        columnId: card.columnId.toString(),
        cardTitle: card.title,
        createdBy: userId.toString(),
      })
    }
  } catch (error) {
    throw error
  }
}

// ==================== LABEL SERVICES ====================

/**
 * Thêm label vào card
 */
const addLabel = async (userId, cardId, labelData) => {
  try {
    // Kiểm tra card tồn tại
    const card = await cardModel.findOneById(cardId)
    if (!card) throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found')

    // Kiểm tra quyền truy cập board
    await checkBoardPermission(card.boardId, userId)

    // Kiểm tra label cùng màu đã tồn tại chưa
    const existingLabel = card.labels?.find((l) => l.color === labelData.color)
    if (existingLabel) {
      throw new ApiError(StatusCodes.CONFLICT, 'Label with this color already exists on this card')
    }

    // Thêm label
    const updatedCard = await cardModel.addLabel(cardId, labelData)

    // Emit socket event
    if (updatedCard && global.io) {
      const roomName = `board:${card.boardId.toString()}`
      global.io.to(roomName).emit('BE_CARD_LABEL_ADDED', {
        boardId: card.boardId.toString(),
        cardId: updatedCard._id.toString(),
        columnId: card.columnId.toString(),
        labels: updatedCard.labels,
        addedBy: userId.toString(),
      })
    }

    return updatedCard
  } catch (error) {
    throw error
  }
}

/**
 * Cập nhật label trong card
 */
const updateLabel = async (userId, cardId, labelId, labelData) => {
  try {
    const card = await cardModel.findOneById(cardId)
    if (!card) throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found')

    // Kiểm tra label tồn tại
    const labelExists = card.labels?.find((l) => l._id === labelId)
    if (!labelExists) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Label not found')
    }

    // Kiểm tra quyền
    await checkBoardPermission(card.boardId, userId)

    // Nếu đổi màu, kiểm tra màu mới đã tồn tại chưa
    if (labelData.color && labelData.color !== labelExists.color) {
      const colorExists = card.labels?.find((l) => l.color === labelData.color && l._id !== labelId)
      if (colorExists) {
        throw new ApiError(StatusCodes.CONFLICT, 'Label with this color already exists on this card')
      }
    }

    // Update label
    const updatedCard = await cardModel.updateLabel(cardId, labelId, labelData)

    // Emit socket event
    if (updatedCard && global.io) {
      const roomName = `board:${card.boardId.toString()}`
      global.io.to(roomName).emit('BE_CARD_LABEL_UPDATED', {
        boardId: card.boardId.toString(),
        cardId: updatedCard._id.toString(),
        columnId: card.columnId.toString(),
        labels: updatedCard.labels,
        updatedBy: userId.toString(),
      })
    }

    return updatedCard
  } catch (error) {
    throw error
  }
}

/**
 * Xóa label khỏi card
 */
const removeLabel = async (userId, cardId, labelId) => {
  try {
    const card = await cardModel.findOneById(cardId)
    if (!card) throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found')

    // Kiểm tra label tồn tại
    const labelExists = card.labels?.find((l) => l._id === labelId)
    if (!labelExists) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Label not found')
    }

    // Kiểm tra quyền
    await checkBoardPermission(card.boardId, userId)

    // Remove label
    const updatedCard = await cardModel.removeLabel(cardId, labelId)

    // Emit socket event
    if (updatedCard && global.io) {
      const roomName = `board:${card.boardId.toString()}`
      global.io.to(roomName).emit('BE_CARD_LABEL_REMOVED', {
        boardId: card.boardId.toString(),
        cardId: updatedCard._id.toString(),
        columnId: card.columnId.toString(),
        labels: updatedCard.labels,
        removedLabelId: labelId,
        removedBy: userId.toString(),
      })
    }

    return updatedCard
  } catch (error) {
    throw error
  }
}

export const cardService = {
  createNew,
  update,
  deleteOne,
  // Label services
  addLabel,
  updateLabel,
  removeLabel,
}
