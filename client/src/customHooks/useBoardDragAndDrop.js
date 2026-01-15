import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSensor, useSensors, closestCorners, getFirstCollision, pointerWithin } from '@dnd-kit/core'
import { MouseSensor, TouchSensor } from '~/customLibraries/DndKitSensors'
import { arrayMove } from '@dnd-kit/sortable'
import { cloneDeep, isEmpty } from 'lodash'
import { generatePlaceholderCard } from '~/utils/formatter'

export const DRAG_ITEM_TYPE = {
  COLUMN: 'COLUMN',
  CARD: 'CARD',
}

const TRIGGER = {
  DRAG_OVER: 'DRAG_OVER',
  DRAG_END: 'DRAG_END',
}

export const useBoardDragAndDrop = ({ board, onMoveColumn, onMoveCardSameColumn, onMoveCardDifferentColumn }) => {
  // ===== STATE =====
  const [orderedColumns, setOrderedColumns] = useState([])
  // cùng một thời điểm chỉ có một item đang kéo thả
  const [activeDragItemId, setActiveDragItemId] = useState(null)
  const [activeDragItemType, setActiveDragItemType] = useState(null)
  const [activeDragItemData, setActiveDragItemData] = useState(null)
  const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] = useState(null) // Column gốc chứa card trước khi bắt đầu kéo
  const lastOverId = useRef(null) // điểm va chạm cuối cùng trước đó (xử lý thuật toán phát hiện va chạm)

  // Sync orderedColumns với board.columns
  useEffect(() => {
    setOrderedColumns(board.columns)
  }, [board])

  // Map: cardId → columnId (để biết card nằm trong column nào)
  const cardToColumnMap = useMemo(() => {
    const map = {}
    orderedColumns.forEach((column) => {
      column.cards.forEach((card) => {
        map[card._id] = column._id
      })
    })
    return map
  }, [orderedColumns])

  // Map: columnId → column object (để lấy column object từ columnId)
  const columnMap = useMemo(() => {
    const map = {}
    orderedColumns.forEach((column) => {
      map[column._id] = column
    })
    return map
  }, [orderedColumns])

  // ===== SENSORS =====
  // desktop
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // di chuyển chuột 10px để kích hoạt kéo thả
    },
  })

  // mobile
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // nhấn giữ khoảng 250ms để kích hoạt kéo thả
      tolerance: 500,
    },
  })

  const sensors = useSensors(mouseSensor, touchSensor)

  // ===== HELPER FUNCTIONS =====
  // Tìm column chứa card
  const findColumnByCardId = useCallback(
    (cardId) => {
      const columnId = cardToColumnMap[cardId]
      return columnId ? columnMap[columnId] : null
    },
    [cardToColumnMap, columnMap],
  )

  // Tính vị trí mới của card khi thả
  const calculateNewCardIndex = useCallback((overColumn, overCardId, active, over) => {
    const overCardIndex = overColumn.cards.findIndex((card) => card._id === overCardId)

    const isBelowOverItem = active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height

    const modifier = isBelowOverItem ? 1 : 0

    return overCardIndex >= 0 ? overCardIndex + modifier : overColumn.cards.length
  }, [])

  // Xóa card khỏi column (source)
  const removeCardFromSourceColumn = useCallback((column, cardId) => {
    column.cards = column.cards.filter((card) => card._id !== cardId)

    // Thêm placeholder nếu column rỗng
    if (isEmpty(column.cards)) {
      column.cards = [generatePlaceholderCard(column)]
    }

    column.cardOrderIds = column.cards.map((card) => card._id)
  }, [])

  // Thêm card vào column (target)
  const addCardToTargetColumn = useCallback((column, cardData, newIndex) => {
    // Xóa card nếu đã tồn tại (tránh duplicate)
    column.cards = column.cards.filter((card) => card._id !== cardData._id)

    // Cập nhật columnId cho card
    const updatedCard = { ...cardData, columnId: column._id }

    // Thêm card vào vị trí mới
    column.cards.splice(newIndex, 0, updatedCard)

    // Xóa placeholder nếu có
    column.cards = column.cards.filter((card) => !card.FE_PlaceholderCard)

    // Cập nhật cardOrderIds
    column.cardOrderIds = column.cards.map((card) => card._id)
  }, [])

  // ===== MOVE CARD BETWEEN COLUMNS =====
  const moveCardBetweenColumns = useCallback(
    ({ sourceColumnId, targetColumnId, cardId, cardData, overCardId, active, over, trigger }) => {
      setOrderedColumns((currentColumns) => {
        const columns = cloneDeep(currentColumns)

        const sourceColumn = columns.find((col) => col._id === sourceColumnId)
        const targetColumn = columns.find((col) => col._id === targetColumnId)

        if (!sourceColumn || !targetColumn) return currentColumns

        // Tính vị trí mới
        const newIndex = calculateNewCardIndex(targetColumn, overCardId, active, over)

        // Xử lý source column
        removeCardFromSourceColumn(sourceColumn, cardId)

        // Xử lý target column
        addCardToTargetColumn(targetColumn, cardData, newIndex)

        // Gọi API nếu là DRAG_END
        if (trigger === TRIGGER.DRAG_END) {
          onMoveCardDifferentColumn(cardId, oldColumnWhenDraggingCard._id, targetColumn._id, columns)
        }

        return columns
      })
    },
    [calculateNewCardIndex, removeCardFromSourceColumn, addCardToTargetColumn, oldColumnWhenDraggingCard, onMoveCardDifferentColumn],
  )

  // ===== EVENT HANDLERS =====
  // Bắt đầu kéo
  const handleDragStart = useCallback(
    (event) => {
      const { active } = event
      const activeData = active.data.current

      setActiveDragItemId(active.id)
      setActiveDragItemType(activeData?.columnId ? DRAG_ITEM_TYPE.CARD : DRAG_ITEM_TYPE.COLUMN)
      setActiveDragItemData(activeData)

      // Lưu column gốc nếu đang kéo card
      if (activeData?.columnId) {
        setOldColumnWhenDraggingCard(findColumnByCardId(active.id))
      }
    },
    [findColumnByCardId],
  )

  // Đang kéo qua các elements
  const handleDragOver = useCallback(
    (event) => {
      // Không xử lý nếu đang kéo column
      if (activeDragItemType === DRAG_ITEM_TYPE.COLUMN) return

      const { active, over } = event
      if (!active || !over) return

      const activeDraggingCardId = active.id
      const activeDraggingCardData = active.data.current
      const overCardId = over.id

      const activeColumn = findColumnByCardId(activeDraggingCardId)
      const overColumn = findColumnByCardId(overCardId)

      if (!activeColumn || !overColumn) return

      // Chỉ xử lý khi kéo sang column khác
      if (activeColumn._id !== overColumn._id) {
        moveCardBetweenColumns({
          sourceColumnId: activeColumn._id,
          targetColumnId: overColumn._id,
          cardId: activeDraggingCardId,
          cardData: activeDraggingCardData,
          overCardId,
          active,
          over,
          trigger: TRIGGER.DRAG_OVER,
        })
      }
    },
    [activeDragItemType, findColumnByCardId, moveCardBetweenColumns],
  )

  // Kết thúc kéo
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event
      if (!active || !over) return

      // ===== XỬ LÝ KÉO CARD =====
      if (activeDragItemType === DRAG_ITEM_TYPE.CARD) {
        const activeDraggingCardId = active.id
        const activeDraggingCardData = active.data.current
        const overCardId = over.id

        const activeColumn = findColumnByCardId(activeDraggingCardId)
        const overColumn = findColumnByCardId(overCardId)

        if (!activeColumn || !overColumn) return

        // Kéo card sang column khác
        if (oldColumnWhenDraggingCard._id !== overColumn._id) {
          moveCardBetweenColumns({
            sourceColumnId: activeColumn._id,
            targetColumnId: overColumn._id,
            cardId: activeDraggingCardId,
            cardData: activeDraggingCardData,
            overCardId,
            active,
            over,
            trigger: TRIGGER.DRAG_END,
          })
        } else {
          // Kéo card trong cùng column
          const oldIndex = activeColumn.cards.findIndex((c) => c._id === activeDragItemId)
          const newIndex = overColumn.cards.findIndex((c) => c._id === overCardId)

          if (oldIndex !== newIndex) {
            const dndOrderedCards = arrayMove(activeColumn.cards, oldIndex, newIndex)
            const dndOrderedCardIds = dndOrderedCards.map((card) => card._id)

            setOrderedColumns((prevColumns) => {
              const columns = cloneDeep(prevColumns)
              const targetColumn = columns.find((col) => col._id === overColumn._id)

              if (targetColumn) {
                targetColumn.cards = dndOrderedCards
                targetColumn.cardOrderIds = dndOrderedCardIds
              }

              return columns
            })

            onMoveCardSameColumn(dndOrderedCards, dndOrderedCardIds, oldColumnWhenDraggingCard._id)
          }
        }
      }

      // ===== XỬ LÝ KÉO COLUMN =====
      if (activeDragItemType === DRAG_ITEM_TYPE.COLUMN) {
        if (active.id !== over.id) {
          const oldIndex = orderedColumns.findIndex((c) => c._id === active.id)
          const newIndex = orderedColumns.findIndex((c) => c._id === over.id)

          const dndOrderedColumns = arrayMove(orderedColumns, oldIndex, newIndex)
          setOrderedColumns(dndOrderedColumns)
          onMoveColumn(dndOrderedColumns)
        }
      }

      // Reset state
      setActiveDragItemId(null)
      setActiveDragItemType(null)
      setActiveDragItemData(null)
      setOldColumnWhenDraggingCard(null)
    },
    [
      activeDragItemType,
      activeDragItemId,
      findColumnByCardId,
      moveCardBetweenColumns,
      oldColumnWhenDraggingCard,
      orderedColumns,
      onMoveColumn,
      onMoveCardSameColumn,
    ],
  )

  // ===== COLLISION DETECTION =====
  const collisionDetectionStrategy = useCallback(
    (args) => {
      // Kéo column thì dùng closestCorners
      if (activeDragItemType === DRAG_ITEM_TYPE.COLUMN) {
        return closestCorners({ ...args })
      }

      // Tìm các điểm va chạm với con trỏ
      const pointerIntersections = pointerWithin(args)
      if (!pointerIntersections?.length) return []

      // Lấy overId đầu tiên
      let overId = getFirstCollision(pointerIntersections, 'id')

      if (overId) {
        // Nếu overId là column, tìm card gần nhất bên trong
        const checkColumn = columnMap[overId]

        if (checkColumn) {
          overId = closestCorners({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (container) => container.id !== overId && checkColumn.cardOrderIds?.includes(container.id),
            ),
          })[0]?.id
        }

        lastOverId.current = overId
        return [{ id: overId }]
      }

      return lastOverId.current ? [{ id: lastOverId.current }] : []
    },
    [activeDragItemType, columnMap],
  )

  return {
    // State cần thiết cho UI
    orderedColumns,
    activeDragItemType,
    activeDragItemData,

    // DnD config
    sensors,
    collisionDetectionStrategy,

    // Event handlers
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  }
}
