import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { BOARD_INVITATION_STATUS, INVITATION_TYPES } from '~/utils/constants'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

// define collection name
const INVITATION_COLLECTION_NAME = 'invitations'
const INVITATION_COLLECTION_SCHEMA = Joi.object({
  inviterId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE), // người đi mời
  inviteeId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE), // người được mời
  // kiểu của lời mời
  type: Joi.string()
    .required()
    .valid(...Object.values(INVITATION_TYPES)),

  // lời mời là board thì sẽ lưu thêm dữ liệu là boardInvitation - optional
  boardInvitation: Joi.object({
    boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    // status của boardInvitation
    status: Joi.string()
      .required()
      .valid(...Object.values(BOARD_INVITATION_STATUS)),
  }).optional(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now()),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
})

const validateBeforeCreate = async (data) => await INVITATION_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })

const createNewBoardInvitation = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)

    // biến đối một số dữ liệu liên quan tới ObjectId cho chuẩn
    let newInvitationDataToAdd = {
      ...validData,
      inviterId: new ObjectId(String(validData.inviterId)),
      inviteeId: new ObjectId(String(validData.inviteeId)),
    }

    // nếu tồn tại boardInvitation thì update cho boardId
    if (validData.boardInvitation) {
      newInvitationDataToAdd.boardInvitation = {
        ...validData.boardInvitation,
        boardId: new ObjectId(String(validData.boardInvitation.boardId)),
      }
    }

    // insert vào DB
    return await GET_DB().collection(INVITATION_COLLECTION_NAME).insertOne(newInvitationDataToAdd)
  } catch (error) {
    throw new Error(error) // tự tạo mội lỗi mới chuấn Error từ string/giá trị thô
  }
}

const findOneById = async (createdInvitationId) => {
  return await GET_DB()
    .collection(INVITATION_COLLECTION_NAME)
    .findOne({ _id: new ObjectId(String(createdInvitationId)) })
}

// những field không cho phép cập nhật trong hàm update
const INVALID_UPDATE_FIELDS = ['_id', 'inviterId', 'inviteeId', 'type', 'createdAt']
const update = async (invitationId, updateData) => {
  try {
    // lọc những field ko cho phép cập nhật
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) delete updateData[fieldName]
    })

    // biến đổi dữ liệu liên quan tới ObjectId
    if (updateData.boardInvitation) {
      updateData.boardInvitation = {
        ...updateData.boardInvitation,
        boardId: new ObjectId(String(updateData.boardInvitation.boardId)),
      }
    }

    const result = await GET_DB()
      .collection(INVITATION_COLLECTION_NAME)
      .findOneAndUpdate({ _id: new ObjectId(String(invitationId)) }, { $set: updateData }, { returnDocument: 'after' })

    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const invitationModel = {
  INVITATION_COLLECTION_NAME,
  INVITATION_COLLECTION_SCHEMA,
  createNewBoardInvitation,
  findOneById,
  update,
}
