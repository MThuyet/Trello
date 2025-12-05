import express from 'express'
import { invitationController } from '~/controllers/invitationController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { invitationValidation } from '~/validations/invitationValidation'

const Router = express.Router()

// get invitation by User
Router.route('/').get(authMiddleware.isAuthorized, invitationController.getInvitations)

// create new invitation
Router.route('/board').post(
  authMiddleware.isAuthorized,
  invitationValidation.createNewBoardInvitation,
  invitationController.createNewBoardInvitation,
)

Router.route('/board/:invitationId').put(
  authMiddleware.isAuthorized,
  invitationValidation.updateBoardInvitation,
  invitationController.updateBoardInvitation,
)

export const invitationRoute = Router
