import { StatusCodes } from 'http-status-codes'
import { boardModel } from '~/models/boardModel'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import ApiError from '~/utils/ApiError'

const createNew = async (reqBody) => {
  try {
    const createdColumn = await columnModel.createNew(reqBody)

    const getNewColumn = await columnModel.findOneById(createdColumn.insertedId)

    if (getNewColumn) {
      // tạo mảng cards rỗng để FE xử lý
      getNewColumn.cards = []

      // cập nhật lại columnOrderIds trong Board
      await boardModel.pushColumnOrderIds(getNewColumn)

      return getNewColumn
    }
  } catch (error) {
    throw error
  }
}

const updateColumn = async (columnId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }

    const updatedColumn = await columnModel.updateColumn(columnId, updateData)

    return updatedColumn
  } catch (error) {
    throw error
  }
}

const deleteColumn = async (columnId) => {
  try {
    const targetColumn = await columnModel.findOneById(columnId)
    if (!targetColumn) throw new ApiError(StatusCodes.NOT_FOUND, 'Column not found!')

    // xóa column
    await columnModel.deleteOneById(columnId)

    // xóa card bên trong column
    await cardModel.deleteManyByColumnId(columnId)

    // xóa columnId trong mảng columnOrderIds của board
    await boardModel.pullColumnOrderIds(targetColumn)

    return { deleteResult: 'Column and its Cards deleted successfully!' }
  } catch (error) {
    throw error
  }
}

export const columnService = {
  createNew,
  updateColumn,
  deleteColumn
}
