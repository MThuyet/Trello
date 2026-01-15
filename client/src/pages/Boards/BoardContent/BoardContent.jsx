import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { DndContext, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core'
import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'
import { useBoardDragAndDrop, DRAG_ITEM_TYPE } from '~/customHooks/useBoardDragAndDrop'

const customDropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: 0.5 } },
  }),
}

const BoardContent = ({ board, moveColumn, moveCardInTheSameColumn, moveCardToDifferentColumn }) => {
  const {
    orderedColumns,
    activeDragItemType,
    activeDragItemData,
    sensors,
    collisionDetectionStrategy,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useBoardDragAndDrop({
    board,
    onMoveColumn: moveColumn,
    onMoveCardSameColumn: moveCardInTheSameColumn,
    onMoveCardDifferentColumn: moveCardToDifferentColumn,
  })

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}>
      <Box
        sx={{
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
          width: '100%',
          height: (theme) => theme.trello.boardContentHeight,
          p: '10px 0',
        }}>
        <ListColumns columns={orderedColumns} />
        <DragOverlay dropAnimation={customDropAnimation}>
          {!activeDragItemType && null}
          {activeDragItemType === DRAG_ITEM_TYPE.COLUMN && <Column column={activeDragItemData} />}
          {activeDragItemType === DRAG_ITEM_TYPE.CARD && <Card card={activeDragItemData} />}
        </DragOverlay>
      </Box>
    </DndContext>
  )
}

export default BoardContent
