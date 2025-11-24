import { StatusCodes } from 'http-status-codes'
import { cardService } from '~/services/cardService'

const createNew = async (req, res, next) => {
  try {
    const createCard = await cardService.createNew(req.body)

    return res.status(StatusCodes.CREATED).json(createCard)
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const cardCoverFile = req.file
    const updateCard = await cardService.update(cardId, req.body, cardCoverFile)

    return res.status(StatusCodes.OK).json(updateCard)
  } catch (error) {
    next(error)
  }
}

export const cardController = {
  createNew,
  update,
}
