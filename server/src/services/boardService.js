import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
import { DEFAULT_ITEM_PER_PAGE, DEFAULT_PAGE } from '~/utils/constants'

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

const update = async (boardId, reqBody = {}) => {
  const { memberId, columnOrderIds, ...generalFields } = reqBody

  const board = await boardModel.findOneById(boardId)
  if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')

  if (columnOrderIds) {
    const payload = { columnOrderIds, updatedAt: Date.now() }
    return boardModel.updateColumnOrderIds(boardId, payload)
  }

  if (memberId) {
    // chỉ xoá member, không tự thêm trường nào khác
    const result = await boardModel.pullMemberIds(boardId, memberId)
    await boardModel.update(boardId, { updatedAt: Date.now() })
    return result
  }

  if (Object.keys(generalFields).length) {
    return boardModel.update(boardId, {
      ...generalFields,
      updatedAt: Date.now(),
    })
  }

  return board
}

const moveCardToDifferentColumn = async (reqBody) => {
  try {
    // B1: Cập nhật lại mảng cardOrderIds trong column gốc (xóa _id của card ra khỏi mảng cardOrderIds)
    await columnModel.updateColumn(reqBody.originalColumnId, { cardOrderIds: reqBody.originalCardOrderIds })
    // B2: Cập nhật lại mảng cardOrderIds trong column đích (thêm _id của card vào mảng cardOrderIds)
    await columnModel.updateColumn(reqBody.newColumnId, { cardOrderIds: reqBody.newCardOrderIds })
    // B3: Cập nhật lại columnId của card thay đổi
    await cardModel.update(reqBody.currentCardId, { columnId: reqBody.newColumnId, updatedAt: Date.now() })
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
}
