import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { CloundinaryProvider } from '~/providers/CloundinaryProvider'
import ApiError from '~/utils/ApiError'

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

const update = async (cardId, reqBody, cardCoverFile, userInfor) => {
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
    } else if (updateData.incommingMemberInfo) {
      // trường hợp add hoặc remove member on card
      updatedCard = await cardModel.updateMembers(cardId, updateData.incommingMemberInfo)
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

    return updatedCard
  } catch (error) {
    throw error
  }
}

const deleteOne = async (cardId) => {
  try {
    const card = await cardModel.findOneById(cardId)
    if (!card) throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found!')

    await columnModel.pullCardOrderIds(card)
    return await cardModel.deleteOneById(cardId)
  } catch (error) {
    throw error
  }
}

export const cardService = {
  createNew,
  update,
  deleteOne,
}
