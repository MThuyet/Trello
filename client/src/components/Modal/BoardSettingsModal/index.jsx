import { useState } from 'react'
import Box from '@mui/material/Box'
import Modal from '@mui/material/Modal'
import Typography from '@mui/material/Typography'
import CancelIcon from '@mui/icons-material/Cancel'
import SubtitlesIcon from '@mui/icons-material/Subtitles'
import ToggleFocusInput from '~/components/Form/ToggleFocusInput'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Divider from '@mui/material/Divider'
import { BOARD_TYPES } from '~/utils/constants'
import BoardMembersList from '~/components/Modal/BoardSettingsModal/BoardMembersList'

const BoardSettingsModal = ({ board, isOpen, onClose }) => {
  // State cho description và type
  const [description, setDescription] = useState(board?.description || '')
  const [type, setType] = useState(board?.type || BOARD_TYPES.PUBLIC)

  // Cập nhật board title
  const handleUpdateBoardTitle = async (newTitle) => {
    console.log(newTitle)
  }

  // Cập nhật board description
  const handleUpdateDescription = async () => {
    console.log(description)
  }

  // Cập nhật board type
  const handleUpdateType = async (newType) => {
    console.log(newType)
  }

  // Reset state khi modal đóng
  const handleClose = () => {
    setDescription(board?.description || '')
    setType(board?.type || BOARD_TYPES.PUBLIC)
    onClose()
  }

  if (!board) return null

  return (
    <Modal open={isOpen} onClose={handleClose} sx={{ overflowY: 'auto' }}>
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
          <CancelIcon color="error" sx={{ '&:hover': { color: 'error.light' } }} onClick={handleClose} />
        </Box>

        {/* Section 1: Thông tin Board */}
        <Box sx={{ mb: 4 }}>
          {/* Title */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SubtitlesIcon />
            <ToggleFocusInput value={board?.title || ''} onChangedValue={handleUpdateBoardTitle} inputFontSize="18px" />
          </Box>

          {/* Description */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: '600' }}>
              Description
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleUpdateDescription}
              placeholder="Add a description to your board..."
              variant="outlined"
              size="small"
            />
          </Box>

          {/* Type */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: '600' }}>
              Visibility
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Board Type</InputLabel>
              <Select
                value={type}
                label="Board Type"
                onChange={(e) => {
                  const newType = e.target.value
                  setType(newType)
                  handleUpdateType(newType)
                }}>
                <MenuItem value={BOARD_TYPES.PUBLIC}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Public</Typography>
                    <Typography variant="caption" color="text.secondary">
                      - Anyone can view
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value={BOARD_TYPES.PRIVATE}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Private</Typography>
                    <Typography variant="caption" color="text.secondary">
                      - Only members can view
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Section 2: Quản lý thành viên */}
        <BoardMembersList />
      </Box>
    </Modal>
  )
}

export default BoardSettingsModal
