import Box from '@mui/material/Box'
import Modal from '@mui/material/Modal'
import CancelIcon from '@mui/icons-material/Cancel'
import Divider from '@mui/material/Divider'
import BoardMembersList from '~/components/Modal/BoardSettingsModal/BoardMembersList'
import BoardInfoSection from './BoardInfoSection'
import { useDispatch, useSelector } from 'react-redux'
import { selectCurrentActiveBoard, updateCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice'
import { useCallback } from 'react'
import { cloneDeep } from 'lodash'

const BoardSettingsModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch()
  const currentBoard = useSelector(selectCurrentActiveBoard)

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

  return (
    <Modal open={isOpen} onClose={onClose} sx={{ overflowY: 'auto' }}>
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
      </Box>
    </Modal>
  )
}

export default BoardSettingsModal
