import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import ApiError from '~/utils/ApiError'
import { ACTION_UPDATE_CARD_MEMBERS, LABEL_COLORS } from '~/utils/constants'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    title: Joi.string().required().min(3).max(50).trim().strict(),
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details?.map((d) => d.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

const update = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string().min(3).max(50).trim().strict(),
    description: Joi.string().optional(),
    incomingMemberInfo: Joi.object({
      action: Joi.string()
        .valid(...Object.values(ACTION_UPDATE_CARD_MEMBERS))
        .required(),
      memberId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
    }),
    commentToAdd: Joi.object({
      content: Joi.string().required().min(1).max(1000).trim().strict(),
      // Các field khác là optional và sẽ được service set
      userAvatar: Joi.optional(),
      userDisplayName: Joi.string().optional(),
    })
      .unknown(false) // ⚠️ Không cho phép field lạ
      .optional(),
    commentToDelete: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).optional(),
  })

  try {
    // chỉ định abortEarly: false để trả về tất cả các lỗi validate
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details?.map((d) => d.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

const deleteOne = async (req, res, next) => {
  try {
    const correctCondition = Joi.object({
      id: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    })

    await correctCondition.validateAsync(req.params, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details?.map((d) => d.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

// ==================== LABEL VALIDATIONS ====================

/**
 * Validation thêm label vào card
 */
const addLabel = async (req, res, next) => {
  const paramsCondition = Joi.object({
    id: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  })

  const bodyCondition = Joi.object({
    color: Joi.string()
      .valid(...Object.values(LABEL_COLORS))
      .required(),
    text: Joi.string().max(30).allow('').default(''),
  })

  try {
    await paramsCondition.validateAsync(req.params, { abortEarly: false })
    await bodyCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details?.map((d) => d.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

/**
 * Validation cập nhật label trong card
 */
const updateLabel = async (req, res, next) => {
  const paramsCondition = Joi.object({
    id: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    labelId: Joi.string().required(),
  })

  const bodyCondition = Joi.object({
    color: Joi.string().valid(...Object.values(LABEL_COLORS)),
    text: Joi.string().max(30).allow(''),
  }).min(1) // Ít nhất 1 field phải được truyền

  try {
    await paramsCondition.validateAsync(req.params, { abortEarly: false })
    await bodyCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details?.map((d) => d.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

/**
 * Validation xóa label khỏi card
 */
const removeLabel = async (req, res, next) => {
  const paramsCondition = Joi.object({
    id: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    labelId: Joi.string().required(),
  })

  try {
    await paramsCondition.validateAsync(req.params, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details?.map((d) => d.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

export const cardValidation = {
  createNew,
  update,
  deleteOne,
  // Label validations
  addLabel,
  updateLabel,
  removeLabel,
}
