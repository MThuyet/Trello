import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { CloundinaryProvider } from '~/providers/CloundinaryProvider'

const createNew = async (reqBody) => {
  try {
    const createdCard = await cardModel.createNew(reqBody)

    const getNewCard = await cardModel.findOneById(createdCard.insertedId)

    if (getNewCard) {
      await columnModel.pushCardOrderIds(getNewCard)

      return getNewCard
    }
  } catch (error) {
    throw error
  }
}

const update = async (cardId, reqBody, cardCoverFile) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now(),
    }

    let updatedCard = {}

    if (cardCoverFile) {
      // trường hợp upload cover file
      const uploadResult = await CloundinaryProvider.streamUpload(cardCoverFile.buffer, 'cards')
      updatedCard = await cardModel.update(cardId, {
        cover: uploadResult.secure_url,
      })
    } else {
      // các trường hợp update thông tin chung (title, description,...)
      updatedCard = await cardModel.update(cardId, updateData)
    }

    return updatedCard
  } catch (error) {
    throw error
  }
}

export const cardService = {
  createNew,
  update,
}
