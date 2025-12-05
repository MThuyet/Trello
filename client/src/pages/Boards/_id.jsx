// Board Details
import Container from '@mui/material/Container'
import AppBar from '~/components/AppBar/AppBar'
import BoardBar from './BoardBar'
import BoardContent from './BoardContent/BoardContent'
import { useEffect, useState } from 'react'
import { updateBoardDetailsAPI, updateColumnDetailsAPI, moveCardToDifferentColumnAPI } from '~/apis'
import { useDispatch, useSelector } from 'react-redux'
import {
  addMemberToBoard,
  fetchBoardDetailsAPI,
  selectCurrentActiveBoard,
  updateCurrentActiveBoard,
} from '~/redux/activeBoard/activeBoardSlice'
import { cloneDeep } from 'lodash'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PageLoadingSpinner from '~/components/Loading/PageLoadingSpinner'
import ActiveCard from '~/components/Modal/ActiveCard/ActiveCard'
import { socketIoInstance } from '~/socketClient'

const Board = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  // lấy dữ liệu board từ redux
  const board = useSelector(selectCurrentActiveBoard)
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

  // useEffect để join board room khi vào board
  useEffect(() => {
    // Chỉ join khi đã có boardId và board đã load xong
    if (!boardId || !board) return

    // Emit event để join vào board room
    socketIoInstance.emit('FE_JOIN_BOARD_ROOM', boardId)

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
  }, [boardId, board])

  // useEffect để listen socket event khi có member mới join board
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

    // set state
    const dndOrderedColumnsIds = dndOrderedColumns.map((c) => c._id)

    const newBoard = cloneDeep(board)
    newBoard.columns = dndOrderedColumns
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
