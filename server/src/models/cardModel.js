import Joi from 'joi'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { ACTION_UPDATE_CARD_MEMBERS, LABEL_COLORS } from '~/utils/constants'

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
      _id: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
      userId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
      userEmail: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
      userAvatar: Joi.string(),
      userDisplayName: Joi.string(),
      content: Joi.string(),
      // sử dụng hàm push để thêm comment nên ko thể dùng default date.now
      commentedAt: Joi.date().timestamp(),
    })
    .default([]),

  // Labels cho card - embedded trực tiếp trong card
  labels: Joi.array()
    .items({
      _id: Joi.string(),
      color: Joi.string().valid(...Object.values(LABEL_COLORS)).required(),
      text: Joi.string().max(30).allow('').default(''),
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
    throw error
  }
}

const findOneById = async (id) => {
  try {
    const objectId = new ObjectId(String(id))

    return await GET_DB().collection(CARD_COLLECTION_NAME).findOne({ _id: objectId })
  } catch (error) {
    throw error
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
    throw error
  }
}

const deleteManyByColumnId = async (columnId) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .deleteMany({ columnId: new ObjectId(String(columnId)) })

    return result
  } catch (error) {
    throw error
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
    throw error
  }
}

const pullOneComment = async (cardId, commentId) => {
  try {
    const cardObjectId = new ObjectId(String(cardId))
    const commentObjectId = new ObjectId(String(commentId))

    // Atomic operation: chỉ xóa nếu cả card và comment đều tồn tại
    return await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: cardObjectId,
          'comments._id': commentObjectId, // Điều kiện: card phải có comment với _id này
        },
        { $pull: { comments: { _id: commentObjectId } } },
        { returnDocument: 'after' },
      )
  } catch (error) {
    throw error
  }
}

const updateMembers = async (cardId, incomingMemberInfo) => {
  try {
    let updateCondition = {}
    if (incomingMemberInfo.action === ACTION_UPDATE_CARD_MEMBERS.ADD) {
      updateCondition = { $push: { memberIds: new ObjectId(String(incomingMemberInfo.memberId)) } }
    }
    if (incomingMemberInfo.action === ACTION_UPDATE_CARD_MEMBERS.REMOVE) {
      // xóa phần tử khỏi mảng
      updateCondition = { $pull: { memberIds: new ObjectId(String(incomingMemberInfo.memberId)) } }
    }

    return await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate({ _id: new ObjectId(String(cardId)) }, updateCondition, { returnDocument: 'after' })
  } catch (error) {
    throw error
  }
}

const deleteOneById = async (cardId) => {
  try {
    return await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(String(cardId)) })
  } catch (error) {
    throw error
  }
}

const deleteManyByBoardId = async (boardId) => {
  try {
    return await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .deleteMany({ boardId: new ObjectId(String(boardId)) })
  } catch (error) {
    throw error
  }
}

const updateWithSession = async (cardId, updateData, session) => {
  try {
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) delete updateData[fieldName]
    })

    if (updateData.columnId) updateData.columnId = new ObjectId(String(updateData.columnId))

    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(String(cardId)),
        },
        { $set: updateData },
        { returnDocument: 'after', session },
      )

    return result
  } catch (error) {
    throw error
  }
}

// ==================== LABEL METHODS ====================

/**
 * Thêm label mới vào card
 */
const addLabel = async (cardId, labelData) => {
  try {
    const label = {
      _id: new ObjectId().toString(),
      color: labelData.color,
      text: labelData.text || '',
    }

    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(String(cardId)) },
        {
          $push: { labels: label },
          $set: { updatedAt: Date.now() },
        },
        { returnDocument: 'after' },
      )

    return result
  } catch (error) {
    throw error
  }
}

/**
 * Cập nhật label trong card
 */
const updateLabel = async (cardId, labelId, labelData) => {
  try {
    // Tạo object update động dựa vào các field được truyền vào
    const updateFields = {}
    if (labelData.color !== undefined) updateFields['labels.$.color'] = labelData.color
    if (labelData.text !== undefined) updateFields['labels.$.text'] = labelData.text
    updateFields.updatedAt = Date.now()

    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(String(cardId)),
          'labels._id': labelId,
        },
        { $set: updateFields },
        { returnDocument: 'after' },
      )

    return result
  } catch (error) {
    throw error
  }
}

/**
 * Xóa label khỏi card
 */
const removeLabel = async (cardId, labelId) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(String(cardId)) },
        {
          $pull: { labels: { _id: labelId } },
          $set: { updatedAt: Date.now() },
        },
        { returnDocument: 'after' },
      )

    return result
  } catch (error) {
    throw error
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
  pullOneComment,
  updateMembers,
  deleteOneById,
  deleteManyByBoardId,
  updateWithSession,
  // Label methods
  addLabel,
  updateLabel,
  removeLabel,
}
