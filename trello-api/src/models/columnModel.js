import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'

const COLUMN_COLLECTION_NAME = 'columns'
const COLUMN_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  title: Joi.string().required().min(3).max(50).trim().strict(),
  cardOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'boardId', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await COLUMN_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)

    const convertedInsertData = {
      ...validData,
      boardId: new ObjectId(String(validData.boardId))
    }

    return await GET_DB().collection(COLUMN_COLLECTION_NAME).insertOne(convertedInsertData)
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    const objectId = new ObjectId(String(id))

    return await GET_DB().collection(COLUMN_COLLECTION_NAME).findOne({ _id: objectId })
  } catch (error) {
    throw new Error(error)
  }
}

const pushCardOrderIds = async (card) => {
  try {
    const result = await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(String(card.columnId)) },
        { $push: { cardOrderIds: new ObjectId(String(card._id)) } },
        { returnDocument: 'after' }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const updateColumn = async (columnId, updateData) => {
  try {
    // Object.keys() trả về mảng các keys theo thứ tự
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        // xóa các trường không được phép update mà FE cố truyền lên
        delete updateData[fieldName]
      }
    })

    // đối với những trường liên quan tới objectId phải biến đổi
    if (updateData.cardOrderIds) {
      updateData.cardOrderIds = updateData.cardOrderIds.map((id) => new ObjectId(String(id)))
    }

    const result = await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(String(columnId))
        },
        { $set: updateData }, // cập nhật các trường cần thiết
        { returnDocument: 'after' }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const deleteOneById = async (columnId) => {
  try {
    const result = await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(String(columnId)) })

    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const columnModel = {
  COLUMN_COLLECTION_NAME,
  COLUMN_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  pushCardOrderIds,
  updateColumn,
  deleteOneById
}
