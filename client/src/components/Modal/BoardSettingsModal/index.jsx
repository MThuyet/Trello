import Box from '@mui/material/Box'
import Modal from '@mui/material/Modal'
import CancelIcon from '@mui/icons-material/Cancel'
import Divider from '@mui/material/Divider'
import BoardMembersList from '~/components/Modal/BoardSettingsModal/BoardMembersList'
import BoardInfoSection from './BoardInfoSection'
import { useDispatch, useSelector } from 'react-redux'
import { selectCurrentActiveBoard, updateCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice'
import { useCallback, useState } from 'react'
import { cloneDeep } from 'lodash'
import { useConfirm } from 'material-ui-confirm'
import { Button } from '@mui/material'
import { deleteOneBoardAPI } from '~/apis'
import { showSnackbar } from '~/redux/uiSlice/uiSlice'
import { useNavigate } from 'react-router-dom'
import PageLoadingSpinner from '~/components/Loading/PageLoadingSpinner'

const BoardSettingsModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentBoard = useSelector(selectCurrentActiveBoard)
  const confirmDeleteBoard = useConfirm()

  const [isLoadingDeleteBoard, setIsLoadingDeleteBoard] = useState(false)

  // hàm cập nhật chung data board vào redux
  const updateBoardInRedux = useCallback(
    (updatedBoard) => {
      if (!currentBoard || !updatedBoard) return
      const newBoard = cloneDeep(currentBoard)
      Object.assign(newBoard, updatedBoard)
      dispatch(updateCurrentActiveBoard(newBoard))
    },
    [currentBoard, dispatch],
  )

  if (!currentBoard) return null

  const handleDeleteBoard = () => {
    confirmDeleteBoard({
      title: (
        <span>
          Delete Board &quot;<b>{currentBoard?.title}</b>&quot;?
        </span>
      ),
      description: 'This action will permanently delete your board and cannot be undone.',
      confirmationText: 'Delete',
      cancellationText: 'Cancel',
      confirmationButtonProps: { color: 'error' },
    })
      .then(async () => {
        try {
          setIsLoadingDeleteBoard(true)
          await deleteOneBoardAPI(currentBoard._id)
          dispatch(showSnackbar({ message: 'Board deleted successfully', severity: 'success' }))
          navigate('/boards')
        } catch (error) {
          console.log(error.message)
        } finally {
          setIsLoadingDeleteBoard(false)
        }
      })
      .catch(() => {})
  }

  return (
    <Modal open={isOpen} onClose={onClose} sx={{ overflowY: 'auto' }}>
      {isLoadingDeleteBoard ? (
        <PageLoadingSpinner />
      ) : (
        <Box
          sx={{
            position: 'relative',
            width: 700,
            maxWidth: '90vw',
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: '8px',
            border: 'none',
            outline: 0,
            padding: '40px 20px 20px',
            margin: '50px auto',
            backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#1A2027' : '#fff'),
          }}>
          {/* Nút đóng modal */}
          <Box
            sx={{
              position: 'absolute',
              top: '12px',
              right: '10px',
              cursor: 'pointer',
            }}>
            <CancelIcon color="error" sx={{ '&:hover': { color: 'error.light' } }} onClick={onClose} />
          </Box>

          {/* Section 1: Thông tin Board */}
          <BoardInfoSection isOpen={isOpen} currentBoard={currentBoard} updateBoardInRedux={updateBoardInRedux} />

          <Divider sx={{ my: 1 }} />

          {/* Section 2: Quản lý thành viên */}
          <BoardMembersList />

          {/* Nút đơn giản: Xóa board */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" color="error" onClick={handleDeleteBoard} disabled={isLoadingDeleteBoard}>
              Delete Board
            </Button>
          </Box>
        </Box>
      )}
    </Modal>
  )
}

export default BoardSettingsModal
