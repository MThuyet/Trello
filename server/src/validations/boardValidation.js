import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import ApiError from '~/utils/ApiError'
import { BOARD_TYPES } from '~/utils/constants'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const createNew = async (req, res, next) => {
  /*
   * Note: mặc định chúng ta không cần phải custom message ở phía BE vì FE sẽ tự validate và custom ở phía FE
   * Back-end chỉ cần validate đảm bảo dữ liệu chuẩn xác, và trả về message mặc định từ thư viện là được.
   * Quan trọng: việc validate dữ liệu bắt buộc phải có ở BE vì đây là điểm cuối để lưu trữ dữ liệu vào DB
   * Trong thực tế việc validate dữ liệu phải diễn ra ở cả BE và FE
   */
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict().messages({
      // Custom message
      'any.required': 'Title is required',
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least {#limit} characters long',
      'string.max': 'Title must be at most {#limit} characters long',
      'string.trim': 'Title must not contain leading or trailing spaces'
    }),
    description: Joi.string().required().min(3).max(255).trim().strict(),
    type: Joi.string()
      .valid(...Object.values(BOARD_TYPES))
      .required()
  })

  try {
    // kiểm tra xem req.body truyền vào có đúng với điền kiện trên ko
    // abortEarly: mặc định là true thì sẽ dừng tại lỗi đầu tiên, false thì dừng với tất cả lỗi
    await correctCondition.validateAsync(req.body, { abortEarly: false })

    // Validate hợp lệ thì cho đi tiếp (gọi callback tiếp theo)
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const updateColumnOrderIds = async (req, res, next) => {
  const correctCondition = Joi.object({
    columnOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).required()
  })

  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true // cho phép có thể truyền vào các field không được khai báo trong điều kiện
    })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const moveCardToDifferentColumn = async (req, res, next) => {
  const correctCondition = Joi.object({
    currentCardId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
    originalColumnId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
    originalCardOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).required(),
    newColumnId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
    newCardOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const boardValidation = {
  createNew,
  updateColumnOrderIds,
  moveCardToDifferentColumn
}
