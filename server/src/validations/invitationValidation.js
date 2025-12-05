import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import ApiError from '~/utils/ApiError'
import { BOARD_INVITATION_STATUS } from '~/utils/constants'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const createNewBoardInvitation = async (req, res, next) => {
  const correctCondition = Joi.object({
    inviteeEmail: Joi.string().required(),
    boardId: Joi.string().required(),
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details?.map((d) => d.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

const updateBoardInvitation = async (req, res, next) => {
  const correctCondition = Joi.object({
    status: Joi.string()
      .valid(...Object.values(BOARD_INVITATION_STATUS))
      .required()
      .messages({
        'any.only': 'Status must be either ACCEPTED or REJECTED',
        'any.required': 'Status is required',
      }),
  })

  const paramsCondition = Joi.object({
    invitationId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    await paramsCondition.validateAsync(req.params, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details?.map((d) => d.message).join(', ') || error.message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

export const invitationValidation = {
  createNewBoardInvitation,
  updateBoardInvitation,
}
