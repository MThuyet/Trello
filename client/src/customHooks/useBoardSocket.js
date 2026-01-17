import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { socketIoInstance } from '~/socketClient'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { selectCurrentActiveCard, clearAndHideCurrentActiveCard, updateCardLabels } from '~/redux/activeCard/activeCardSlice'
import { showSnackbar } from '~/redux/uiSlice/uiSlice'
import {
  addCardToColumn,
  addColumnToBoard,
  addMemberToBoard,
  moveCardToDifferentColumnState,
  removeCardFromBoard,
  removeColumnFromBoard,
  removeMemberFromBoard,
  updateCardInBoard,
  updateColumnInBoard,
  updateCurrentActiveBoard,
  updateCardLabelsInBoard,
} from '~/redux/activeBoard/activeBoardSlice'
import { updateCurrentActiveCard } from '~/redux/activeCard/activeCardSlice'

// Socket event names
const SOCKET_EVENTS = {
  // Events FE emit
  FE_JOIN_BOARD_ROOM: 'FE_JOIN_BOARD_ROOM',

  // Events BE emit
  BE_JOINED_BOARD_ROOM: 'BE_JOINED_BOARD_ROOM',
  BE_MEMBER_JOINED_BOARD: 'BE_MEMBER_JOINED_BOARD',
  BE_MEMBER_REMOVED_FROM_BOARD: 'BE_MEMBER_REMOVED_FROM_BOARD',
  BE_DELETED_CARD: 'BE_DELETED_CARD',
  BE_DELETE_COLUMN: 'BE_DELETE_COLUMN',
  BE_NEW_COLUMN_CREATED: 'BE_NEW_COLUMN_CREATED',
  BE_BOARD_UPDATED_GENERAL_FIELDS: 'BE_BOARD_UPDATED_GENERAL_FIELDS',
  BE_COLUMN_UPDATED: 'BE_COLUMN_UPDATED',
  BE_COLUMN_ORDER_IDS_UPDATED: 'BE_COLUMN_ORDER_IDS_UPDATED',
  BE_CARD_MOVED_TO_DIFFERENT_COLUMN: 'BE_CARD_MOVED_TO_DIFFERENT_COLUMN',
  BE_NEW_CARD_CREATED: 'BE_NEW_CARD_CREATED',
  BE_CARD_UPDATED: 'BE_CARD_UPDATED',
  BE_BOARD_DELETED: 'BE_BOARD_DELETED',
  // Label events
  BE_CARD_LABEL_ADDED: 'BE_CARD_LABEL_ADDED',
  BE_CARD_LABEL_UPDATED: 'BE_CARD_LABEL_UPDATED',
  BE_CARD_LABEL_REMOVED: 'BE_CARD_LABEL_REMOVED',
}

// Custom hook để quản lý tất cả socket listeners cho Board
export const useBoardSocket = (board) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const currentActiveCard = useSelector(selectCurrentActiveCard)

  // Join board room khi vào board
  useEffect(() => {
    if (!board?._id) return

    socketIoInstance.emit(SOCKET_EVENTS.FE_JOIN_BOARD_ROOM, board._id, currentUser._id)

    const handleJoinedRoom = (data) => {
      console.log('Joined board room:', data)
    }

    socketIoInstance.on(SOCKET_EVENTS.BE_JOINED_BOARD_ROOM, handleJoinedRoom)

    return () => {
      socketIoInstance.off(SOCKET_EVENTS.BE_JOINED_BOARD_ROOM, handleJoinedRoom)
    }
  }, [board?._id, currentUser._id])

  // Tất cả board-related socket listeners
  useEffect(() => {
    if (!board?._id) return

    const boardId = board._id

    // ===== MEMBER EVENTS =====
    const handleMemberJoined = (data) => {
      if (data.boardId === boardId) {
        dispatch(addMemberToBoard(data.newMember))
        dispatch(showSnackbar({ message: `${data.newMember.displayName} joined the board`, severity: 'info' }))
      }
    }

    const handleMemberRemoved = (data) => {
      if (data.boardId === boardId) {
        // Nếu chính mình bị xóa, redirect về boards
        if (data.removedMember._id === currentUser._id) {
          navigate('/boards')
          dispatch(showSnackbar({ message: 'You have been removed from this board', severity: 'warning' }))
          return
        }
        dispatch(removeMemberFromBoard(data.removedMember))
      }
    }

    // ===== CARD EVENTS =====
    const handleCardDeleted = (data) => {
      if (data.boardId === boardId) {
        dispatch(removeCardFromBoard(data))

        if (data.createdBy !== currentUser._id) {
          dispatch(showSnackbar({ message: `Card ${data.cardTitle} has been deleted`, severity: 'info' }))
        }

        // Đóng modal nếu card đang mở bị xóa
        if (currentActiveCard?._id === data.cardId) {
          dispatch(clearAndHideCurrentActiveCard())
        }
      }
    }

    const handleCardMoved = (data) => {
      if (data.boardId === boardId) {
        dispatch(moveCardToDifferentColumnState(data))
      }
    }

    const handleNewCardCreated = (data) => {
      if (data.boardId === boardId) {
        dispatch(addCardToColumn(data))
        if (data.createdBy !== currentUser._id) {
          dispatch(showSnackbar({ message: `Card "${data.title}" has been added`, severity: 'info' }))
        }
      }
    }

    const handleCardUpdated = (data) => {
      if (data.boardId === boardId) {
        // Cập nhật card trong board (ListCards)
        dispatch(updateCardInBoard(data))

        // Nếu card đang được mở trong modal, cập nhật luôn
        if (currentActiveCard?._id === data._id) {
          dispatch(updateCurrentActiveCard(data))
        }
      }
    }

    // ===== COLUMN EVENTS =====
    const handleColumnDeleted = (data) => {
      if (data.boardId === boardId) {
        dispatch(removeColumnFromBoard(data))
        dispatch(showSnackbar({ message: `Column "${data.columnTitle}" has been deleted`, severity: 'info' }))

        // Đóng modal nếu card trong column bị xóa
        if (currentActiveCard?.columnId === data.columnId) {
          dispatch(clearAndHideCurrentActiveCard())
        }
      }
    }

    const handleNewColumnCreated = (data) => {
      if (data.boardId === boardId) {
        dispatch(addColumnToBoard(data))

        if (data.createdBy !== currentUser._id) {
          dispatch(showSnackbar({ message: `Column "${data.title}" has been added`, severity: 'info' }))
        }
      }
    }

    const handleColumnUpdated = (data) => {
      if (data.boardId === boardId) {
        dispatch(updateColumnInBoard(data))
      }
    }

    const handleColumnOrderIdsUpdated = (data) => {
      if (data._id === boardId) {
        dispatch(updateCurrentActiveBoard(data))
      }
    }

    // ===== BOARD EVENTS =====
    const handleBoardUpdatedGeneralFields = (data) => {
      if (data._id === boardId) {
        dispatch(updateCurrentActiveBoard(data))
      }
    }

    const handleBoardDeleted = (data) => {
      if (data.boardId === boardId) {
        // Đóng modal card nếu đang mở
        dispatch(clearAndHideCurrentActiveCard())
        // Redirect về trang boards
        navigate('/boards')
        dispatch(showSnackbar({ message: `Board "${data.boardTitle}" has been deleted`, severity: 'warning' }))
      }
    }

    // ===== LABEL EVENTS =====
    const handleCardLabelAdded = (data) => {
      if (data.boardId === boardId) {
        // Cập nhật card trong board
        dispatch(
          updateCardLabelsInBoard({
            cardId: data.cardId,
            columnId: data.columnId,
            labels: data.labels,
          }),
        )

        // Cập nhật activeCard nếu đang mở
        if (currentActiveCard?._id === data.cardId) {
          dispatch(updateCardLabels(data.labels))
        }
      }
    }

    const handleCardLabelUpdated = (data) => {
      if (data.boardId === boardId) {
        dispatch(
          updateCardLabelsInBoard({
            cardId: data.cardId,
            columnId: data.columnId,
            labels: data.labels,
          }),
        )

        if (currentActiveCard?._id === data.cardId) {
          dispatch(updateCardLabels(data.labels))
        }
      }
    }

    const handleCardLabelRemoved = (data) => {
      if (data.boardId === boardId) {
        dispatch(
          updateCardLabelsInBoard({
            cardId: data.cardId,
            columnId: data.columnId,
            labels: data.labels,
          }),
        )

        if (currentActiveCard?._id === data.cardId) {
          dispatch(updateCardLabels(data.labels))
        }
      }
    }

    // ===== REGISTER ALL LISTENERS =====
    socketIoInstance.on(SOCKET_EVENTS.BE_MEMBER_JOINED_BOARD, handleMemberJoined)
    socketIoInstance.on(SOCKET_EVENTS.BE_MEMBER_REMOVED_FROM_BOARD, handleMemberRemoved)
    socketIoInstance.on(SOCKET_EVENTS.BE_DELETED_CARD, handleCardDeleted)
    socketIoInstance.on(SOCKET_EVENTS.BE_CARD_MOVED_TO_DIFFERENT_COLUMN, handleCardMoved)
    socketIoInstance.on(SOCKET_EVENTS.BE_NEW_CARD_CREATED, handleNewCardCreated)
    socketIoInstance.on(SOCKET_EVENTS.BE_CARD_UPDATED, handleCardUpdated)
    socketIoInstance.on(SOCKET_EVENTS.BE_DELETE_COLUMN, handleColumnDeleted)
    socketIoInstance.on(SOCKET_EVENTS.BE_NEW_COLUMN_CREATED, handleNewColumnCreated)
    socketIoInstance.on(SOCKET_EVENTS.BE_COLUMN_UPDATED, handleColumnUpdated)
    socketIoInstance.on(SOCKET_EVENTS.BE_COLUMN_ORDER_IDS_UPDATED, handleColumnOrderIdsUpdated)
    socketIoInstance.on(SOCKET_EVENTS.BE_BOARD_UPDATED_GENERAL_FIELDS, handleBoardUpdatedGeneralFields)
    socketIoInstance.on(SOCKET_EVENTS.BE_BOARD_DELETED, handleBoardDeleted)
    // Label listeners
    socketIoInstance.on(SOCKET_EVENTS.BE_CARD_LABEL_ADDED, handleCardLabelAdded)
    socketIoInstance.on(SOCKET_EVENTS.BE_CARD_LABEL_UPDATED, handleCardLabelUpdated)
    socketIoInstance.on(SOCKET_EVENTS.BE_CARD_LABEL_REMOVED, handleCardLabelRemoved)

    // ===== CLEANUP ALL LISTENERS =====
    return () => {
      socketIoInstance.off(SOCKET_EVENTS.BE_MEMBER_JOINED_BOARD, handleMemberJoined)
      socketIoInstance.off(SOCKET_EVENTS.BE_MEMBER_REMOVED_FROM_BOARD, handleMemberRemoved)
      socketIoInstance.off(SOCKET_EVENTS.BE_DELETED_CARD, handleCardDeleted)
      socketIoInstance.off(SOCKET_EVENTS.BE_CARD_MOVED_TO_DIFFERENT_COLUMN, handleCardMoved)
      socketIoInstance.off(SOCKET_EVENTS.BE_NEW_CARD_CREATED, handleNewCardCreated)
      socketIoInstance.off(SOCKET_EVENTS.BE_CARD_UPDATED, handleCardUpdated)
      socketIoInstance.off(SOCKET_EVENTS.BE_DELETE_COLUMN, handleColumnDeleted)
      socketIoInstance.off(SOCKET_EVENTS.BE_NEW_COLUMN_CREATED, handleNewColumnCreated)
      socketIoInstance.off(SOCKET_EVENTS.BE_COLUMN_UPDATED, handleColumnUpdated)
      socketIoInstance.off(SOCKET_EVENTS.BE_COLUMN_ORDER_IDS_UPDATED, handleColumnOrderIdsUpdated)
      socketIoInstance.off(SOCKET_EVENTS.BE_BOARD_UPDATED_GENERAL_FIELDS, handleBoardUpdatedGeneralFields)
      socketIoInstance.off(SOCKET_EVENTS.BE_BOARD_DELETED, handleBoardDeleted)
      // Label cleanup
      socketIoInstance.off(SOCKET_EVENTS.BE_CARD_LABEL_ADDED, handleCardLabelAdded)
      socketIoInstance.off(SOCKET_EVENTS.BE_CARD_LABEL_UPDATED, handleCardLabelUpdated)
      socketIoInstance.off(SOCKET_EVENTS.BE_CARD_LABEL_REMOVED, handleCardLabelRemoved)
    }
  }, [board?._id, currentUser._id, currentActiveCard?._id, currentActiveCard?.columnId, dispatch, navigate])
}
