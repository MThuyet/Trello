import { StatusCodes } from 'http-status-codes'
import { invitationService } from '~/services/invitationService'

const getInvitations = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const resInvitations = await invitationService.gesInvitations(userId, resInvitations)

    return res.status(StatusCodes.OK).json(resInvitations)
  } catch (error) {
    next(error)
  }
}

const createNewBoardInvitation = async (req, res, next) => {
  try {
    // user thực hiện request này chính là inviter
    const inviterId = req.jwtDecoded._id
    const resInvitation = await invitationService.createNewBoardInvitation(inviterId, req.body)

    return res.status(StatusCodes.CREATED).json(resInvitation)
  } catch (error) {
    next(error)
  }
}

const updateBoardInvitation = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { invitationId } = req.params
    const { status } = req.body

    const updatedInvitation = await invitationService.updateBoardInvitation(userId, invitationId, status)
    return res.status(StatusCodes.OK).json(updatedInvitation)
  } catch (error) {
    next(error)
  }
}

export const invitationController = {
  createNewBoardInvitation,
  getInvitations,
  updateBoardInvitation,
}
