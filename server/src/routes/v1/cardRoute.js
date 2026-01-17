import express from 'express'
import { cardValidation } from '~/validations/cardValidation'
import { cardController } from '~/controllers/cardController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'

const Router = express.Router()

Router.route('/').post(authMiddleware.isAuthorized, cardValidation.createNew, cardController.createNew)

Router.route('/:id').put(
  authMiddleware.isAuthorized,
  multerUploadMiddleware.upload.single('cover'),
  cardValidation.update,
  cardController.update,
)

Router.route('/:id').delete(authMiddleware.isAuthorized, cardValidation.deleteOne, cardController.deleteOne)

// ==================== LABEL ROUTES ====================
// POST /cards/:id/labels - Thêm label vào card
Router.route('/:id/labels').post(authMiddleware.isAuthorized, cardValidation.addLabel, cardController.addLabel)

// PUT /cards/:id/labels/:labelId - Cập nhật label
// DELETE /cards/:id/labels/:labelId - Xóa label
Router.route('/:id/labels/:labelId')
  .put(authMiddleware.isAuthorized, cardValidation.updateLabel, cardController.updateLabel)
  .delete(authMiddleware.isAuthorized, cardValidation.removeLabel, cardController.removeLabel)

export const cardRoute = Router
