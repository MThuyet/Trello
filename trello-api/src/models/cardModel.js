import Joi from 'joi'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'

// Define Collection (name & schema)
const CARD_COLLECTION_NAME = 'cards'
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().optional(),
  cover: Joi.string().default(null),
  memberIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),

  // thay vì tạo một collection comments, thì embedded trực tiếp trong card
  comments: Joi.array()
    .items({
      userId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
      userEmail: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
      userAvatar: Joi.string(),
      userDisplayName: Joi.string(),
      content: Joi.string(),
      // sử dụng hàm push để thêm comment nên ko thể dùng default date.now
      commentedAt: Joi.date().timestamp(),
    })
    .default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
})

const INVALID_UPDATE_FIELDS = ['_id', 'boardId', 'createdAt', '_destroy']

const validateBeforeCreate = async (data) => {
  return await CARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const convertedInsertData = {
      ...validData,
      boardId: new ObjectId(String(validData.boardId)),
      columnId: new ObjectId(String(validData.columnId)),
    }

    return await GET_DB().collection(CARD_COLLECTION_NAME).insertOne(convertedInsertData)
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    const objectId = new ObjectId(String(id))

    return await GET_DB().collection(CARD_COLLECTION_NAME).findOne({ _id: objectId })
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (cardId, updateData) => {
  try {
    // Object.keys() trả về mảng các keys theo thứ tự
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        // xóa các trường không được phép update mà FE cố truyền lên
        delete updateData[fieldName]
      }
    })

    // đối với những trường liên quan tới objectId phải biến đổi
    if (updateData.columnId) updateData.columnId = new ObjectId(String(updateData.columnId))

    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(String(cardId)),
        },
        { $set: updateData }, // cập nhật các trường cần thiết
        { returnDocument: 'after' },
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const deleteManyByColumnId = async (columnId) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .deleteMany({ columnId: new ObjectId(String(columnId)) })

    return result
  } catch (error) {
    throw new Error(error)
  }
}

// hàm đẩy comment mới vào mảng, nhưng trong mgdb hiện tại chỉ có $push - mặc định sẽ đẩy comment vào cuối mảng
// => vẫn dùng $push, nhưng bọc data vào array để trong $each và chỉ định posision: 0
const unShiftNewComment = async (cardId, commentData) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(String(cardId)) },
        { $push: { comments: { $each: [commentData], $position: 0 } } },
        { returnDocument: 'after' },
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  validateBeforeCreate,
  createNew,
  findOneById,
  update,
  deleteManyByColumnId,
  unShiftNewComment,
}
