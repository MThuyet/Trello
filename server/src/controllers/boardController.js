import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/boardService'

const getBoards = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    // lấy page và itemPerPage từ query url phía client
    const { page, itemPerPage, q } = req.query
    const queryFilters = q

    const result = await boardService.getBoards(userId, page, itemPerPage, queryFilters)

    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    // Điều hướng dữ liệu sang tầng Service
    const createBoard = await boardService.createNew(userId, req.body)

    // Có kết quả trả về phía client
    res.status(StatusCodes.CREATED).json(createBoard)
  } catch (error) {
    // Khi gọi next, express sẽ đưa về nơi xử lý lỗi tập trung
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const boardId = req.params.id
    const board = await boardService.getDetails(userId, boardId)
    res.status(StatusCodes.OK).json(board)
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const currentUserId = req.jwtDecoded._id
    const updatedBoard = await boardService.update(boardId, req.body, currentUserId)
    return res.status(StatusCodes.OK).json(updatedBoard)
  } catch (error) {
    next(error)
  }
}

const moveCardToDifferentColumn = async (req, res, next) => {
  try {
    const result = await boardService.moveCardToDifferentColumn(req.body)

    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const deleteOne = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const result = await boardService.deleteOne(req.params.id, userId)
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const boardController = {
  getBoards,
  createNew,
  getDetails,
  update,
  moveCardToDifferentColumn,
  deleteOne,
}
