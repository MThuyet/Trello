import { StatusCodes } from 'http-status-codes'
import { cardService } from '~/services/cardService'

const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const createCard = await cardService.createNew(req.body, userId)

    return res.status(StatusCodes.CREATED).json(createCard)
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const cardCoverFile = req.file
    const userInfor = req.jwtDecoded
    const updateCard = await cardService.update(cardId, req.body, cardCoverFile, userInfor)

    return res.status(StatusCodes.OK).json(updateCard)
  } catch (error) {
    next(error)
  }
}

const deleteOne = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const result = await cardService.deleteOne(req.params.id, userId)

    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// ==================== LABEL CONTROLLERS ====================

/**
 * Thêm label vào card
 */
const addLabel = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const cardId = req.params.id
    const result = await cardService.addLabel(userId, cardId, req.body)
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Cập nhật label trong card
 */
const updateLabel = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { id: cardId, labelId } = req.params
    const result = await cardService.updateLabel(userId, cardId, labelId, req.body)
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Xóa label khỏi card
 */
const removeLabel = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { id: cardId, labelId } = req.params
    const result = await cardService.removeLabel(userId, cardId, labelId)
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const cardController = {
  createNew,
  update,
  deleteOne,
  // Label controllers
  addLabel,
  updateLabel,
  removeLabel,
}
