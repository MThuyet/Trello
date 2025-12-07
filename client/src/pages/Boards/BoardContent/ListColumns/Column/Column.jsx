import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useState, useRef, useEffect } from 'react'
import Tooltip from '@mui/material/Tooltip'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import AddCardIcon from '@mui/icons-material/AddCard'
import Button from '@mui/material/Button'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import Box from '@mui/material/Box'
import ListCards from './ListCards/ListCards'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TextField from '@mui/material/TextField'
import CloseIcon from '@mui/icons-material/Close'
import { useConfirm } from 'material-ui-confirm'
import { createNewCardAPI, updateColumnDetailsAPI } from '~/apis'
import { cloneDeep } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { selectCurrentActiveBoard, updateCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice'
import { deleteColumnAPI } from '~/apis'
import ToggleFocusInput from '~/components/Form/ToggleFocusInput'
import { showSnackbar } from '~/redux/uiSlice/uiSlice'
import EditIcon from '@mui/icons-material/Edit'

const Column = ({ column }) => {
  // redux
  const dispatch = useDispatch()
  const board = useSelector(selectCurrentActiveBoard)

  // Dropdown
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  // Card đã được sắp xếp
  const orderedCards = column.cards

  // Drag and Drop
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column._id,
    data: { ...column },
  })

  const dndKitColumnStyle = {
    // dùng touchAction: 'none' để không bị lỗi kéo thả trên mobile
    // touchAction: 'none', // dành cho sensor default dạng PointerSensor
    // nếu sử dụng CSS.Tranform như doc thì bị lỗi stretch
    // https://github.com/clauderic/dnd-kit/issues/117
    transform: CSS.Translate.toString(transform),
    transition,
    height: '100%', // chiều cao phải 100% để không bị lỗi kéo thả, kết hợp với listeners ở Box chứ k phải div ngoài cùng
    opacity: isDragging ? 0.5 : undefined,
  }

  // đóng mở form tạo Card
  const [openNewCardForm, setOpenNewCardForm] = useState(false)
  const toggleOpenNewCardForm = () => setOpenNewCardForm(!openNewCardForm)

  const [newCardTitle, setNewCardTitle] = useState('')
  const [isLoadingAddCard, setIsLoadingAddCard] = useState(false)
  const [isLoadingDeleteColumn, setIsLoadingDeleteColumn] = useState(false)
  const [isLoadingUpdateColumnTitle, setIsLoadingUpdateColumnTitle] = useState(false)

  // Ref để focus vào TextField khi mở form từ dropdown
  const cardTitleInputRef = useRef(null)
  const columnTitleInputRef = useRef(null)

  const handleFocusColumnTitle = () => {
    // Đợi Menu đóng hoàn toàn trước khi focus
    setTimeout(() => {
      columnTitleInputRef.current?.focus()
    }, 100)
  }

  // Tự động focus vào TextField khi form mở
  useEffect(() => {
    if (openNewCardForm && cardTitleInputRef.current) {
      cardTitleInputRef.current?.focus()
    }
  }, [openNewCardForm])

  // hàm tạo Card
  const addNewCard = async () => {
    try {
      const newCardTitle = newCardTitle.trim()
      if (newCardTitle.length < 3 || newCardTitle.length > 50) {
        dispatch(showSnackbar({ message: 'Card title must be between 3 and 50 characters', severity: 'error' }))
        return false
      }

      const newCardData = {
        title: newCardTitle,
        columnId: column._id,
      }

      // call API tạo card
      setIsLoadingAddCard(true)
      const createdCard = await createNewCardAPI({
        ...newCardData,
        boardId: board._id,
      })

      if (createdCard) {
        const newBoard = cloneDeep(board)
        // tìm column chứa card vừa tạo và cập nhật column đó
        const columnToUpdate = newBoard.columns.find((column) => column._id === createdCard.columnId)
        if (columnToUpdate) {
          // nếu column rỗng hoặc chỉ chứa card ảo do FE
          if (columnToUpdate.cards.some((card) => card.FE_PlaceholderCard)) {
            columnToUpdate.cards = [createdCard]
            columnToUpdate.cardOrderIds = [createdCard._id]
          } else {
            // column đã có data thật thì push vào cuối mảng
            columnToUpdate.cards.push(createdCard)
            columnToUpdate.cardOrderIds.push(createdCard._id)
          }
        }
        dispatch(updateCurrentActiveBoard(newBoard))

        // reset lại trạng thái
        setNewCardTitle('')
        toggleOpenNewCardForm()
      }
      return true
    } catch (error) {
      return false
    } finally {
      setIsLoadingAddCard(false)
    }
  }

  // xử lý xóa column và cards bên trong nó
  const confirmDeleteColumn = useConfirm()
  const handleDeleteColumn = () => {
    confirmDeleteColumn({
      title: (
        <span>
          Delete Column &quot;<b>{column?.title}</b>&quot;?
        </span>
      ),
      description: <span>This action will permanently delete your Column and its Cards!</span>,
      confirmationText: 'Delete Column',
      cancellationText: 'Cancel',
      confirmationButtonProps: { color: 'error' },
    }).then(async () => {
      try {
        setIsLoadingDeleteColumn(true)
        // xóa column và card bên trong nó
        // update chuẩn dữ liệu state
        const newBoard = cloneDeep(board)
        newBoard.columns = newBoard.columns.filter((c) => c._id !== column._id)
        newBoard.columnOrderIds = newBoard.columnOrderIds.filter((_id) => _id !== column._id)
        // gọi API xử lý phía backend
        await deleteColumnAPI(column._id)
        dispatch(showSnackbar({ message: 'Deleted column and its cards successfully!', severity: 'success' }))

        dispatch(updateCurrentActiveBoard(newBoard))
      } catch (error) {
        console.log(error.message)
      } finally {
        setIsLoadingDeleteColumn(false)
      }
    })
  }

  // update column title
  const onUpdateColumnTitle = async (newTitle) => {
    try {
      if (!newTitle) {
        dispatch(showSnackbar({ message: 'Please enter column title', severity: 'error' }))
        return false
      }

      if (newTitle.length < 3 || newTitle.length > 50) {
        dispatch(showSnackbar({ message: 'Column title must be between 3 and 50 characters', severity: 'error' }))
        return false // Trả về false để ToggleFocusInput biết là fail để rollback về giá trị cũ
      }

      if (newTitle === column.title) return true // Không cần update nhưng vẫn return true

      setIsLoadingUpdateColumnTitle(true)
      await updateColumnDetailsAPI(column._id, { title: newTitle })
      const newBoard = cloneDeep(board)
      const columnToUpdate = newBoard.columns.find((c) => c._id === column._id)
      if (columnToUpdate) columnToUpdate.title = newTitle
      dispatch(updateCurrentActiveBoard(newBoard))
      dispatch(showSnackbar({ message: 'Updated column successfully!', severity: 'success' }))
      return true // Trả về true để báo thành công
    } catch (error) {
      console.log(error.message)
      dispatch(showSnackbar({ message: error.message || 'Failed to update column title', severity: 'error' }))
      return false // Trả về false khi có lỗi
    } finally {
      setIsLoadingUpdateColumnTitle(false)
    }
  }

  return (
    <div ref={setNodeRef} style={dndKitColumnStyle} {...attributes}>
      <Box
        {...listeners}
        className={`${isLoadingDeleteColumn ? 'interceptor-loading' : ''}`}
        sx={{
          minWidth: '300px',
          maxWidth: '300px',
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#333643' : '#ebecf0'),
          ml: 2,
          borderRadius: '6px',
          height: 'fit-content',
          maxHeight: (theme) => `calc(${theme.trello.boardContentHeight} - ${theme.spacing(5)})`,
        }}>
        {/* Column Header */}
        <Box
          sx={{
            height: (theme) => theme.trello.columnHeaderHeight,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <ToggleFocusInput
            disabled={isLoadingUpdateColumnTitle}
            data-no-dnd="true"
            value={column?.title}
            onChangedValue={onUpdateColumnTitle}
            ref={columnTitleInputRef}
          />

          {/* dropdown */}
          <Box>
            <Tooltip title="More actions">
              <ExpandMoreIcon
                id="basic-column-dropdown"
                aria-controls={open ? 'basic-menu-column-dropdown' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                sx={{
                  color: 'text.primary',
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
            <Menu
              id="basic-menu-column-dropdown"
              MenuListProps={{
                'aria-labelledby': 'basic-column-dropdown',
              }}
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onClick={handleClose}>
              <MenuItem onClick={handleFocusColumnTitle}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Edit column title</ListItemText>
              </MenuItem>

              <MenuItem
                onClick={toggleOpenNewCardForm}
                sx={{
                  '&: hover': {
                    color: 'success.light',
                    '& .add-card-icon': { color: 'success.light' },
                  },
                }}>
                <ListItemIcon>
                  <AddCardIcon className="add-card-icon" fontSize="small" />
                </ListItemIcon>
                <ListItemText>Add new card</ListItemText>
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={handleDeleteColumn}
                sx={{
                  '&: hover': {
                    color: 'warning.dark',
                    '& .delete-forever-icon': { color: 'warning.dark' },
                  },
                }}>
                <ListItemIcon>
                  <DeleteForeverIcon className="delete-forever-icon" fontSize="small" />
                </ListItemIcon>

                <ListItemText>Delete this column</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <ListCards cards={orderedCards} />

        {/* Column Footer */}
        <Box
          sx={{
            height: (theme) => theme.trello.columnFooterHeight,
            p: 2,
          }}>
          {/* Form add Card */}
          {!openNewCardForm ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Button startIcon={<AddCardIcon />} onClick={toggleOpenNewCardForm}>
                Add new cart
              </Button>
              <Tooltip title="Drag to move">
                <DragHandleIcon sx={{ cursor: 'pointer' }}></DragHandleIcon>
              </Tooltip>
            </Box>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
              <TextField
                label="Enter card title..."
                type="text"
                size="small"
                variant="outlined"
                autoFocus
                inputRef={cardTitleInputRef}
                data-no-dnd="true"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                sx={{
                  width: '100%',
                  '& label': { color: (theme) => theme.palette.primary.main },
                  '& input': {
                    color: (theme) => theme.palette.primary.main,
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#333643' : 'white'),
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: (theme) => theme.palette.primary.main },
                    '&:hover fieldset': { borderColor: (theme) => theme.palette.primary.main },
                    '&.Mui-focused fieldset': { borderColor: (theme) => theme.palette.primary.main },
                  },
                  '& .MuiOutlinedInput-input': {
                    borderRadius: 1,
                  },
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}>
                <Button
                  loading={isLoadingAddCard}
                  data-no-dnd="true"
                  onClick={addNewCard}
                  variant="contained"
                  color="success"
                  size="small"
                  sx={{
                    boxShadow: 'none',
                    border: '0.5px solid',
                    borderColor: (theme) => theme.palette.success.main,
                    '&:hover': { bgcolor: (theme) => theme.palette.success.main },
                  }}>
                  Add
                </Button>
                <CloseIcon
                  data-no-dnd="true"
                  onClick={toggleOpenNewCardForm}
                  fontSize="small"
                  sx={{
                    color: (theme) => theme.palette.warning.light,
                    cursor: 'pointer',
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </div>
  )
}

export default Column
