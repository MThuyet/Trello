import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import ApiError from '~/utils/ApiError'
import { BOARD_TYPES } from '~/utils/constants'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict(),
    description: Joi.string().required().min(3).max(255).trim().strict(),
    type: Joi.string()
      .valid(...Object.values(BOARD_TYPES))
      .required(),
  })

  try {
    // kiểm tra xem req.body truyền vào có đúng với điền kiện trên ko
    // abortEarly: mặc định là true thì sẽ dừng tại lỗi đầu tiên, false thì dừng với tất cả lỗi
    await correctCondition.validateAsync(req.body, { abortEarly: false })

    // Validate hợp lệ thì cho đi tiếp (gọi callback tiếp theo)
    next()
  } catch (error) {
    const errorMessage = error.details?.map((d) => d.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

const update = async (req, res, next) => {
  // Validate params
  const paramsCondition = Joi.object({
    id: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
  })

  // Validate body format và structure
  const bodyCondition = Joi.object({
    title: Joi.string().min(3).max(50).trim().strict(),
    description: Joi.string().min(3).max(255).trim().strict(),
    type: Joi.string().valid(...Object.values(BOARD_TYPES)),
    memberId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).optional(),
    columnOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)),
  }).optional() // Cho phép body rỗng hoặc không có

  try {
    await paramsCondition.validateAsync(req.params, { abortEarly: false })
    // Chỉ validate body nếu có
    if (req.body !== null && req.body !== undefined) {
      // Validate req.body là object
      if (typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Request body must be an object')
      }
      await bodyCondition.validateAsync(req.body, { abortEarly: false })
    }

    next()
  } catch (error) {
    const errorMessage = error.details?.map((d) => d.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

const moveCardToDifferentColumn = async (req, res, next) => {
  const correctCondition = Joi.object({
    currentCardId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
    originalColumnId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
    originalCardOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).required(),
    newColumnId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
    newCardOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).required(),
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })

    next()
  } catch (error) {
    const errorMessage = error.details?.map((d) => d.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

const deleteOne = async (req, res, next) => {
  const correctCondition = Joi.object({
    id: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  })

  try {
    await correctCondition.validateAsync(req.params, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details?.map((d) => d.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

export const boardValidation = {
  createNew,
  update,
  moveCardToDifferentColumn,
  deleteOne,
}
