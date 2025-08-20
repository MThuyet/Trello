import express from 'express'
import { boardValidation } from '~/validations/boardValidation'
import { boardController } from '~/controllers/boardController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/')
  .get(authMiddleware.isAuthorized, boardController.getBoards)
  .post(authMiddleware.isAuthorized, boardValidation.createNew, boardController.createNew)

Router.route('/:id')
  .get(authMiddleware.isAuthorized, boardController.getDetails)
  // update column order ids
  .put(authMiddleware.isAuthorized, boardValidation.updateColumnOrderIds, boardController.updateColumnOrderIds)

// move card to different column
Router.route('/supports/moving-cards').put(
  authMiddleware.isAuthorized,
  boardValidation.moveCardToDifferentColumn,
  boardController.moveCardToDifferentColumn
)
export const boardRoute = Router
