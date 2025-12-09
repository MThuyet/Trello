// Board Details
import Container from '@mui/material/Container'
import AppBar from '~/components/AppBar/AppBar'
import BoardBar from './BoardBar'
import BoardContent from './BoardContent/BoardContent'
import { useEffect, useState } from 'react'
import { updateBoardDetailsAPI, updateColumnDetailsAPI, moveCardToDifferentColumnAPI } from '~/apis'
import { useDispatch, useSelector } from 'react-redux'
import {
  addCardToColumn,
  addColumnToBoard,
  addMemberToBoard,
  fetchBoardDetailsAPI,
  moveCardToDifferentColumnState,
  removeCardFromBoard,
  removeColumnFromBoard,
  removeMemberFromBoard,
  selectCurrentActiveBoard,
  updateColumnInBoard,
  updateCurrentActiveBoard,
} from '~/redux/activeBoard/activeBoardSlice'
import { cloneDeep, isEmpty } from 'lodash'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PageLoadingSpinner from '~/components/Loading/PageLoadingSpinner'
import ActiveCard from '~/components/Modal/ActiveCard/ActiveCard'
import { socketIoInstance } from '~/socketClient'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { showSnackbar } from '~/redux/uiSlice/uiSlice'
import { clearAndHideCurrentActiveCard, selectCurrentActiveCard } from '~/redux/activeCard/activeCardSlice'
import { generatePlaceholderCard } from '~/utils/formatter'

const Board = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  // lấy dữ liệu board từ redux
  const board = useSelector(selectCurrentActiveBoard)
  const currentUser = useSelector(selectCurrentUser)
  const currentActiveCard = useSelector(selectCurrentActiveCard)
  const [isLoadingBoard, setIsLoadingBoard] = useState(true)

  // lấy boardId từ url
  const { boardId } = useParams()

  // call api fetch board details
  useEffect(() => {
    setIsLoadingBoard(true)
    dispatch(fetchBoardDetailsAPI(boardId))
      .unwrap()
      .finally(() => {
        setIsLoadingBoard(false)
      })
  }, [dispatch, boardId, navigate])

  // join board room khi vào board
  useEffect(() => {
    // Chỉ join khi đã có boardId và board đã load xong
    if (!boardId || !board) return

    // Emit event để join vào board room
    socketIoInstance.emit('FE_JOIN_BOARD_ROOM', boardId, currentUser._id)

    // Listen để confirm đã join thành công (để debug)
    const handleJoinedRoom = (data) => {
      console.log('Joined board room:', data)
    }
    socketIoInstance.on('BE_JOINED_BOARD_ROOM', handleJoinedRoom)

    // Cleanup function: Chạy khi component unmount hoặc dependencies thay đổi
    return () => {
      // Remove listener để tránh memory leak
      socketIoInstance.off('BE_JOINED_BOARD_ROOM', handleJoinedRoom)
    }
  }, [boardId, board, currentUser._id])

  // listen socket event khi có member mới join board
  useEffect(() => {
    // Chỉ listen khi đang ở board đó
    if (!board || !board._id) return

    // Handler function: Xử lý khi nhận event từ server
    const handleMemberJoined = (data) => {
      // data có cấu trúc: { boardId, newMember, invitation }
      // Kiểm tra xem có phải board hiện tại không
      // Tránh trường hợp user đang ở board A nhưng nhận event từ board B
      if (data.boardId === board._id) {
        // Dispatch action để cập nhật Redux state
        dispatch(addMemberToBoard(data.newMember))
        dispatch(showSnackbar({ message: `${data.newMember.displayName} joined the board`, severity: 'success' }))
      }
    }

    // Đăng ký listener cho event BE_MEMBER_JOINED_BOARD
    // Event này được emit từ server khi có user accept invitation
    socketIoInstance.on('BE_MEMBER_JOINED_BOARD', handleMemberJoined)

    return () => {
      // Remove listener để tránh memory leak
      socketIoInstance.off('BE_MEMBER_JOINED_BOARD', handleMemberJoined)
    }
  }, [board, dispatch])

  // listen socket event khi có member bị xóa khỏi board
  useEffect(() => {
    if (!board || !board._id) return

    const handleMemberRemoved = (data) => {
      if (data.boardId === board._id) {
        if (data.removedMember._id === currentUser._id) {
          navigate('/boards')
          dispatch(showSnackbar({ message: 'You have been removed from this board', severity: 'warning' }))
          return
        }
        dispatch(removeMemberFromBoard(data.removedMember))
      }
    }

    socketIoInstance.on('BE_MEMBER_REMOVED_FROM_BOARD', handleMemberRemoved)

    return () => {
      socketIoInstance.off('BE_MEMBER_REMOVED_FROM_BOARD', handleMemberRemoved)
    }
  }, [board, dispatch, currentUser, navigate])

  // listen socket event khi có card được xóa khỏi board
  useEffect(() => {
    if (!board || !board._id) return

    const handleCardDeleted = (data) => {
      if (data.boardId === board._id) {
        dispatch(removeCardFromBoard(data))

        if (data.createdBy !== currentUser._id) {
          dispatch(showSnackbar({ message: `Card ${data.cardTitle} has been deleted`, severity: 'info' }))
        }

        if (currentActiveCard?._id === data.cardId) {
          dispatch(clearAndHideCurrentActiveCard())
        }
      }
    }

    socketIoInstance.on('BE_DELETED_CARD', handleCardDeleted)

    return () => {
      socketIoInstance.off('BE_DELETED_CARD', handleCardDeleted)
    }
  }, [board, dispatch, currentActiveCard?._id, currentUser._id])

  // listen socket event khi có column được xóa khỏi board
  useEffect(() => {
    if (!board || !board._id) return

    const handleColumnDeleted = (data) => {
      if (data.boardId === board._id) {
        dispatch(removeColumnFromBoard(data))
        dispatch(showSnackbar({ message: `Column "${data.columnTitle}" has been deleted`, severity: 'info' }))

        if (currentActiveCard?.columnId === data.columnId) {
          dispatch(clearAndHideCurrentActiveCard())
        }
      }
    }

    socketIoInstance.on('BE_DELETE_COLUMN', handleColumnDeleted)

    return () => {
      socketIoInstance.off('BE_DELETE_COLUMN', handleColumnDeleted)
    }
  }, [board, dispatch, currentActiveCard?.columnId])

  // listen socket event khi có column mới được tạo trong board
  useEffect(() => {
    if (!board || !board._id) return

    const handleAddedNewColumn = (data) => {
      if (board._id === data.boardId) {
        dispatch(addColumnToBoard(data))

        if (data.createdBy !== currentUser._id) {
          dispatch(showSnackbar({ message: `Column "${data.title}" has been added`, severity: 'info' }))
        }
      }
    }

    socketIoInstance.on('BE_NEW_COLUMN_CREATED', handleAddedNewColumn)

    return () => {
      socketIoInstance.off('BE_NEW_COLUMN_CREATED', handleAddedNewColumn)
    }
  }, [board, dispatch, currentUser._id])

  // listen socket event khi board general fields được cập nhật
  useEffect(() => {
    if (!board || !board._id) return

    const handleBoardUpdatedGeneralFields = (data) => {
      if (board._id === data._id) {
        dispatch(updateCurrentActiveBoard(data))
      }
    }

    socketIoInstance.on('BE_BOARD_UPDATED_GENERAL_FIELDS', handleBoardUpdatedGeneralFields)

    return () => {
      socketIoInstance.off('BE_BOARD_UPDATED_GENERAL_FIELDS', handleBoardUpdatedGeneralFields)
    }
  }, [board, dispatch])

  // listen socket event khi column được cập nhật
  useEffect(() => {
    if (!board || !board._id) return

    const handleUpdatedColumn = (data) => {
      if (board._id === data.boardId) {
        dispatch(updateColumnInBoard(data))
      }
    }

    socketIoInstance.on('BE_COLUMN_UPDATED', handleUpdatedColumn)

    return () => {
      socketIoInstance.off('BE_COLUMN_UPDATED', handleUpdatedColumn)
    }
  }, [board, dispatch])

  // listen socket event khi column order ids được cập nhật
  useEffect(() => {
    if (!board || !board._id) return

    const handleUpdatedColumnOrderIds = (data) => {
      if (board._id === data._id) {
        dispatch(updateCurrentActiveBoard(data))
      }
    }

    socketIoInstance.on('BE_COLUMN_ORDER_IDS_UPDATED', handleUpdatedColumnOrderIds)

    return () => {
      socketIoInstance.off('BE_COLUMN_ORDER_IDS_UPDATED', handleUpdatedColumnOrderIds)
    }
  }, [board, dispatch])

  // lắng nghe card bị move sang column khác
  useEffect(() => {
    if (!board || !board._id) return

    const handleCardMoved = (data) => {
      if (data.boardId === board._id) {
        console.log('ok')
        dispatch(moveCardToDifferentColumnState(data))
      }
    }

    socketIoInstance.on('BE_CARD_MOVED_TO_DIFFERENT_COLUMN', handleCardMoved)
    return () => socketIoInstance.off('BE_CARD_MOVED_TO_DIFFERENT_COLUMN', handleCardMoved)
  }, [board, dispatch])

  // gọi API sắp xếp lại khi kéo thả column xong
  const moveColumn = (dndOrderedColumns) => {
    const dndOrderedColumnsIds = dndOrderedColumns.map((c) => c._id)

    // set lại state trước
    const newBoard = cloneDeep(board)
    newBoard.columns = dndOrderedColumns
    newBoard.columnOrderIds = dndOrderedColumnsIds
    dispatch(updateCurrentActiveBoard(newBoard))

    // call API update
    updateBoardDetailsAPI(board._id, { columnOrderIds: dndOrderedColumnsIds })
  }

  // di chuyển card trong cùng 1 column, gọi API cập nhật mảng cardOrderIds trong column chứa card
  const moveCardInTheSameColumn = (dndOrderedCards, dndOrderedCardIds, columnId) => {
    // update chuẩn dữ liệu state
    const newBoard = cloneDeep(board)
    const columnToUpdate = newBoard.columns.find((column) => column._id === columnId)
    if (columnToUpdate) {
      columnToUpdate.cards = dndOrderedCards
      columnToUpdate.cardOrderIds = dndOrderedCardIds
    }
    dispatch(updateCurrentActiveBoard(newBoard))

    // call API tới backend
    updateColumnDetailsAPI(columnId, { cardOrderIds: dndOrderedCardIds })
  }

  // di chuyển card sang column khác
  const moveCardToDifferentColumn = (currentCardId, originalColumnId, newColumnId, dndOrderedColumns) => {
    /*
			B1: Cập nhật lại mảng cardOrderIds trong column gốc (xóa _id của card ra khỏi mảng cardOrderIds)
			B2: Cập nhật lại mảng cardOrderIds trong column đích (thêm _id của card vào mảng cardOrderIds)
			B3: Cập nhật lại columnId của card thay đổi
		*/

    // Chuẩn hóa dữ liệu column (loại bỏ placeholder thừa và đảm bảo column rỗng vẫn có placeholder)
    const normalizedColumns = dndOrderedColumns.map((column) => {
      const columnClone = cloneDeep(column)

      // Nếu column có card thật, bỏ placeholder ra khỏi danh sách
      const realCards = columnClone.cards.filter((card) => !card.FE_PlaceholderCard)
      if (!isEmpty(realCards)) {
        columnClone.cards = realCards
        columnClone.cardOrderIds = columnClone.cardOrderIds.filter((cardId) => realCards.some((card) => card._id === cardId))
      }

      // Nếu sau khi thao tác column rỗng, thêm placeholder để tiếp tục kéo thả
      if (isEmpty(columnClone.cards)) {
        const placeholderCard = generatePlaceholderCard(columnClone)
        columnClone.cards = [placeholderCard]
        columnClone.cardOrderIds = [placeholderCard._id]
      }

      return columnClone
    })

    const dndOrderedColumnsIds = normalizedColumns.map((c) => c._id)

    const newBoard = cloneDeep(board)
    newBoard.columns = normalizedColumns
    newBoard.columnOrderIds = dndOrderedColumnsIds
    dispatch(updateCurrentActiveBoard(newBoard))

    // gọi API cập nhật
    let originalCardOrderIds = dndOrderedColumns.find((c) => c._id === originalColumnId).cardOrderIds
    // nếu mảng chỉ chứa placeholder card do front-end tạo ra thì xóa đi
    if (originalCardOrderIds[0].includes('placeholder-card')) originalCardOrderIds = []

    moveCardToDifferentColumnAPI({
      currentCardId,
      originalColumnId,
      originalCardOrderIds,
      newColumnId,
      newCardOrderIds: dndOrderedColumns.find((c) => c._id === newColumnId).cardOrderIds,
    })
  }

  // thêm card vào column
  useEffect(() => {
    if (!board || !board._id) return

    const handleAddedNewCard = (data) => {
      if (board._id === data.boardId) {
        dispatch(addCardToColumn(data))
        if (data.createdBy !== currentUser._id) {
          dispatch(showSnackbar({ message: `Card "${data.title}" has been added`, severity: 'info' }))
        }
      }
    }

    socketIoInstance.on('BE_NEW_CARD_CREATED', handleAddedNewCard)

    return () => {
      socketIoInstance.off('BE_NEW_CARD_CREATED', handleAddedNewCard)
    }
  }, [board, dispatch, currentUser._id])

  if (isLoadingBoard) return <PageLoadingSpinner caption="Loading board details..." />

  if (!board && !isLoadingBoard) return <Navigate to="/boards" replace={true} />

  return (
    <Container disableGutters maxWidth={false} sx={{ height: '100vh' }}>
      {/* Modal active card, check đóng mở dựa theo state isShowModalActiveCard lưu trong redux */}
      <ActiveCard />

      <AppBar />
      <BoardBar board={board} />
      <BoardContent
        board={board}
        moveColumn={moveColumn}
        moveCardInTheSameColumn={moveCardInTheSameColumn}
        moveCardToDifferentColumn={moveCardToDifferentColumn}
      />
    </Container>
  )
}

export default Board
