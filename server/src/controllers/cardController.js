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

export const cardController = {
  createNew,
  update,
  deleteOne,
}
