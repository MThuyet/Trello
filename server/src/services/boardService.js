import { pickUser, slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
import { DEFAULT_ITEM_PER_PAGE, DEFAULT_PAGE } from '~/utils/constants'
import { userModel } from '~/models/userModel'
import { ObjectId } from 'mongodb'
import { GET_CLIENT } from '~/config/mongodb'

const getBoards = async (userId, page, itemPerPage, queryFilters) => {
  try {
    if (!page) page = DEFAULT_PAGE
    if (!itemPerPage) itemPerPage = DEFAULT_ITEM_PER_PAGE

    const result = await boardModel.getBoards(userId, parseInt(page, 10), parseInt(itemPerPage, 10), queryFilters)

    return result
  } catch (error) {
    throw error
  }
}

const createNew = async (userId, reqBody) => {
  try {
    // Xử lý logic dữ liệu tùy đặc thù dự án
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title),
    }

    // Gọi tới model để xử lý vào DB
    const createdBoard = await boardModel.createNew(userId, newBoard)

    // Xử lý thêm các logic khác nếu đặc thù dự án cần
    const getNewBoard = await boardModel.findOneById(createdBoard.insertedId)

    // Trả kết quả về, lưu ý trong Service luôn phải có return
    return getNewBoard
  } catch (error) {
    throw error
  }
}

const getDetails = async (userId, boardId) => {
  try {
    const board = await boardModel.getDetails(userId, boardId)

    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')

    // biến đổi dữ liệu phù hợp với FE
    const resBoard = cloneDeep(board)
    // đưa card về đúng column của nó
    resBoard.columns.forEach((column) => {
      // id hiện đang có kiểu dữ liệu là objectId nên phải chuyển về string để so sánh
      // column.cards = resBoard.cards.filter((card) => card.columnId.toString() === column._id.toString())

      // cách dùng .equals() này vì objectId trong MG có support .equals()
      column.cards = resBoard.cards.filter((card) => card.columnId.equals(column._id))
    })

    // xóa mảng cards khỏi Boards
    delete resBoard.cards

    return resBoard
  } catch (error) {
    throw error
  }
}

const update = async (boardId, reqBody = {}, currentUserId) => {
  try {
    const board = await boardModel.findOneById(boardId)
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')

    // Convert currentUserId sang ObjectId để so sánh
    const currentUserIdObjectId = new ObjectId(String(currentUserId))

    // Kiểm tra quyền: user phải là owner hoặc member
    const isOwner = board.ownerIds.some((ownerId) => ownerId.equals(currentUserIdObjectId))
    const isMember = board.memberIds.some((memberId) => memberId.equals(currentUserIdObjectId))

    if (!isOwner && !isMember) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to update this board!')
    }

    const { memberId, columnOrderIds, ...generalFields } = reqBody

    if (columnOrderIds) {
      const payload = { columnOrderIds, updatedAt: Date.now() }
      const columnOrderIdsUpdated = await boardModel.updateColumnOrderIds(boardId, payload)

      if (columnOrderIdsUpdated && global.io) {
        const roomName = `board:${boardId}`
        const boardData = {
          _id: columnOrderIdsUpdated?._id || boardId,
          columnOrderIds: columnOrderIdsUpdated?.columnOrderIds || columnOrderIds,
        }
        global.io.to(roomName).emit('BE_COLUMN_ORDER_IDS_UPDATED', boardData)
      }

      return columnOrderIdsUpdated
    }

    // Xử lý memberId (xóa member): chỉ owner mới được phép
    if (memberId) {
      // B1: pull member khỏi board
      const result = await boardModel.pullMemberIds(boardId, memberId)
      await boardModel.update(boardId, { updatedAt: Date.now() })

      // B2: lấy thông tin member vừa bị xóa để gửi về client
      const removedMember = await userModel.findOneById(memberId)

      // B3: emit socket event đến tất cả user trong board room
      if (global.io) {
        const roomName = `board:${boardId}`
        global.io.to(roomName).emit('BE_MEMBER_REMOVED_FROM_BOARD', {
          boardId,
          removedMember: pickUser(removedMember),
        })
        console.log(`Emitted BE_MEMBER_REMOVED_FROM_BOARD to room: ${roomName}`)
      }

      return result
    }

    // Xử lý generalFields (title, description, type, ...): chỉ owner mới được phép
    if (Object.keys(generalFields).length) {
      const result = await boardModel.update(boardId, {
        ...generalFields,
        updatedAt: Date.now(),
      })

      if (result && global.io) {
        const roomName = `board:${boardId}`
        global.io.to(roomName).emit('BE_BOARD_UPDATED_GENERAL_FIELDS', result)
      }

      return result
    }
  } catch (error) {
    throw error
  }
}

const moveCardToDifferentColumn = async (reqBody) => {
  // ===== VALIDATION =====
  const { currentCardId, originalColumnId, newColumnId, originalCardOrderIds, newCardOrderIds } = reqBody

  // Check required fields
  if (!currentCardId || !originalColumnId || !newColumnId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing required fields')
  }

  // Check arrays
  if (!Array.isArray(newCardOrderIds)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'newCardOrderIds must be an array')
  }

  // Check card exists
  const card = await cardModel.findOneById(currentCardId)
  if (!card) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found')
  }

  // Check columns exist
  const originalColumn = await columnModel.findOneById(originalColumnId)
  const newColumn = await columnModel.findOneById(newColumnId)
  if (!originalColumn || !newColumn) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Column not found')
  }

  // Check columns belong to same board
  if (!originalColumn.boardId.equals(newColumn.boardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Columns must belong to the same board')
  }

  // lấy mg client để tạo session
  const client = GET_CLIENT()
  const session = client.startSession()

  try {
    session.startTransaction()

    // B1: xóa _id của card ra khỏi mảng cardOrderIds ở column gốc
    await columnModel.updateColumnWithSession(
      originalColumnId,
      {
        cardOrderIds: originalCardOrderIds,
      },
      session,
    )

    // B2: thêm _id của card vào mảng cardOrderIds ở column đích
    await columnModel.updateColumnWithSession(
      newColumnId,
      {
        cardOrderIds: newCardOrderIds,
      },
      session,
    )

    // B3: Cập nhật columnId của card
    await cardModel.updateWithSession(
      currentCardId,
      {
        columnId: newColumnId,
        updatedAt: Date.now(),
      },
      session,
    )

    // Nếu tất cả thành công → commit
    await session.commitTransaction()

    // Lấy card đã update để emit socket
    const updatedCard = await cardModel.findOneById(currentCardId)

    // Emit socket cho các user khác trong cùng board room biết card đã được move sang column mới
    if (updatedCard && global.io) {
      const roomName = `board:${updatedCard.boardId.toString()}`
      global.io.to(roomName).emit('BE_CARD_MOVED_TO_DIFFERENT_COLUMN', {
        boardId: updatedCard.boardId.toString(),
        cardId: updatedCard._id.toString(),
        originalColumnId: originalColumnId,
        originalCardOrderIds: originalCardOrderIds,
        newColumnId: newColumnId,
        newCardOrderIds: newCardOrderIds,
        card: updatedCard,
      })
    }

    return updatedCard
  } catch (error) {
    // Nếu có lỗi → rollback tất cả
    await session.abortTransaction()
    throw error
  } finally {
    // End session
    await session.endSession()
  }
}

const deleteOne = async (boardId, userId) => {
  try {
    const board = await boardModel.findOneById(boardId)
    const user = await userModel.findOneById(userId)

    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
    const isOwner = board.ownerIds.some((ownerId) => ownerId.equals(user._id))
    if (!isOwner) throw new ApiError(StatusCodes.FORBIDDEN, 'You are not the owner of this board!')

    // xóa toàn bộ column bên trong board
    await columnModel.deleteManyByBoardId(board._id)

    // xóa toàn bộ card bên trong board
    await cardModel.deleteManyByBoardId(board._id)

    // xóa board
    return await boardModel.deleteOneById(board._id)
  } catch (error) {
    throw error
  }
}

export const boardService = {
  getBoards,
  createNew,
  getDetails,
  update,
  moveCardToDifferentColumn,
  deleteOne,
}
