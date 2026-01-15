// Board Details
import Container from '@mui/material/Container'
import AppBar from '~/components/AppBar/AppBar'
import BoardBar from './BoardBar'
import BoardContent from './BoardContent/BoardContent'
import { useEffect, useState } from 'react'
import { updateBoardDetailsAPI, updateColumnDetailsAPI, moveCardToDifferentColumnAPI } from '~/apis'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBoardDetailsAPI, selectCurrentActiveBoard, updateCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice'
import { cloneDeep } from 'lodash'
import { Navigate, useParams } from 'react-router-dom'
import PageLoadingSpinner from '~/components/Loading/PageLoadingSpinner'
import ActiveCard from '~/components/Modal/ActiveCard/ActiveCard'
import { isPlaceholderCard, ensurePlaceholder, removePlaceholder } from '~/utils/formatter'
import { useBoardSocket } from '~/customHooks/useBoardSocket'

const Board = () => {
  const dispatch = useDispatch()
  const board = useSelector(selectCurrentActiveBoard)
  const [isLoadingBoard, setIsLoadingBoard] = useState(true)

  const { boardId } = useParams()

  // Fetch board details
  useEffect(() => {
    setIsLoadingBoard(true)
    dispatch(fetchBoardDetailsAPI(boardId))
      .unwrap()
      .finally(() => {
        setIsLoadingBoard(false)
      })
  }, [dispatch, boardId])

  // Socket listeners - tất cả logic socket được gom vào hook này
  useBoardSocket(board)

  // ===== DRAG & DROP HANDLERS =====

  // Kéo thả column
  const moveColumn = (dndOrderedColumns) => {
    const dndOrderedColumnsIds = dndOrderedColumns.map((c) => c._id)

    const newBoard = cloneDeep(board)
    newBoard.columns = dndOrderedColumns
    newBoard.columnOrderIds = dndOrderedColumnsIds
    dispatch(updateCurrentActiveBoard(newBoard))

    updateBoardDetailsAPI(board._id, { columnOrderIds: dndOrderedColumnsIds })
  }

  // Kéo thả card trong cùng column
  const moveCardInTheSameColumn = (dndOrderedCards, dndOrderedCardIds, columnId) => {
    const newBoard = cloneDeep(board)
    const columnToUpdate = newBoard.columns.find((column) => column._id === columnId)
    if (columnToUpdate) {
      columnToUpdate.cards = dndOrderedCards
      columnToUpdate.cardOrderIds = dndOrderedCardIds
    }
    dispatch(updateCurrentActiveBoard(newBoard))

    updateColumnDetailsAPI(columnId, { cardOrderIds: dndOrderedCardIds })
  }

  // Kéo thả card sang column khác
  const moveCardToDifferentColumn = (currentCardId, originalColumnId, newColumnId, dndOrderedColumns) => {
    // Chuẩn hóa dữ liệu column
    const normalizedColumns = dndOrderedColumns.map((column) => {
      const columnClone = cloneDeep(column)

      const hasRealCards = columnClone.cards.some((card) => !isPlaceholderCard(card))
      if (hasRealCards) {
        removePlaceholder(columnClone)
      }

      ensurePlaceholder(columnClone)

      return columnClone
    })

    const dndOrderedColumnsIds = normalizedColumns.map((c) => c._id)

    const newBoard = cloneDeep(board)
    newBoard.columns = normalizedColumns
    newBoard.columnOrderIds = dndOrderedColumnsIds
    dispatch(updateCurrentActiveBoard(newBoard))

    // Gọi API
    let originalCardOrderIds = dndOrderedColumns.find((c) => c._id === originalColumnId).cardOrderIds
    if (originalCardOrderIds[0].includes('placeholder-card')) originalCardOrderIds = []

    moveCardToDifferentColumnAPI({
      currentCardId,
      originalColumnId,
      originalCardOrderIds,
      newColumnId,
      newCardOrderIds: dndOrderedColumns.find((c) => c._id === newColumnId).cardOrderIds,
    })
  }

  // ===== RENDER =====

  if (isLoadingBoard) return <PageLoadingSpinner caption="Loading board details..." />

  if (!board && !isLoadingBoard) return <Navigate to="/boards" replace={true} />

  return (
    <Container disableGutters maxWidth={false} sx={{ height: '100vh' }}>
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
