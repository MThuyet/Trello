import { useState } from 'react'
import Box from '@mui/material/Box'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import CheckIcon from '@mui/icons-material/Check'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { LABEL_COLORS } from '~/utils/constants'

/**
 * Component Popover để chọn và quản lý labels
 * @param {HTMLElement} anchorEl - Element để anchor popover
 * @param {boolean} open - Popover đang mở hay không
 * @param {function} onClose - Callback khi đóng popover
 * @param {array} currentLabels - Mảng labels hiện có của card
 * @param {function} onAddLabel - Callback khi thêm label: (labelData) => void
 * @param {function} onUpdateLabel - Callback khi update label: (labelId, labelData) => void
 * @param {function} onRemoveLabel - Callback khi xóa label: (labelId) => void
 */
const LabelPicker = ({ anchorEl, open, onClose, currentLabels = [], onAddLabel, onUpdateLabel, onRemoveLabel }) => {
  const [editingLabel, setEditingLabel] = useState(null)
  const [labelText, setLabelText] = useState('')
  const [selectedColor, setSelectedColor] = useState('blue')
  const [mode, setMode] = useState('select') // 'select' | 'create' | 'edit'

  // Reset state khi đóng popover
  const handleClose = () => {
    setMode('select')
    setEditingLabel(null)
    setLabelText('')
    setSelectedColor('blue')
    onClose()
  }

  // Xử lý click vào màu label
  const handleColorClick = (color) => {
    const existingLabel = currentLabels.find((l) => l.color === color)

    if (existingLabel) {
      // Xóa label nếu đã tồn tại (toggle off)
      onRemoveLabel(existingLabel._id)
    } else {
      // Thêm label mới (toggle on)
      onAddLabel({ color, text: '' })
    }
  }

  // Tạo label mới với text
  const handleCreateLabel = () => {
    if (!selectedColor) return

    onAddLabel({ color: selectedColor, text: labelText.trim() })
    setLabelText('')
    setMode('select')
  }

  // Cập nhật label đang edit
  const handleUpdateLabel = () => {
    if (!editingLabel) return

    onUpdateLabel(editingLabel._id, {
      color: selectedColor,
      text: labelText.trim(),
    })
    setEditingLabel(null)
    setLabelText('')
    setMode('select')
  }

  // Bắt đầu edit một label
  const handleEditClick = (e, label) => {
    e.stopPropagation()
    setEditingLabel(label)
    setLabelText(label.text || '')
    setSelectedColor(label.color)
    setMode('edit')
  }

  // Quay lại mode select
  const handleBack = () => {
    setMode('select')
    setEditingLabel(null)
    setLabelText('')
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: { borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.15)' },
        },
      }}
    >
      <Box sx={{ width: 304, p: 1.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: 0.5 }}>
          {mode !== 'select' && (
            <IconButton size="small" onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{ flex: 1, textAlign: 'center', color: (theme) => theme.palette.text.primary }}
          >
            {mode === 'select' ? 'Labels' : mode === 'create' ? 'Create label' : 'Edit label'}
          </Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Mode: Select Labels */}
        {mode === 'select' && (
          <>
            {/* Label List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
              {Object.keys(LABEL_COLORS).map((color) => {
                const colorConfig = LABEL_COLORS[color]
                const existingLabel = currentLabels.find((l) => l.color === color)
                const isSelected = !!existingLabel

                return (
                  <Box key={color} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      onClick={() => handleColorClick(color)}
                      sx={{
                        flex: 1,
                        height: 32,
                        backgroundColor: colorConfig.bg,
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1.5,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          backgroundColor: colorConfig.hover,
                          transform: 'scale(1.01)',
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ color: colorConfig.text, fontWeight: 500, fontSize: '13px' }}>
                        {existingLabel?.text || ''}
                      </Typography>
                      {isSelected && <CheckIcon sx={{ color: colorConfig.text, fontSize: 18 }} />}
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) => handleEditClick(e, existingLabel || { color, text: '' })}
                      sx={{
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )
              })}
            </Box>

            {/* Create New Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                setSelectedColor('blue')
                setMode('create')
              }}
              sx={{
                textTransform: 'none',
                backgroundColor: '#091e420f',
                color: 'text.primary',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#091e4224',
                  boxShadow: 'none',
                },
              }}
            >
              Create a new label
            </Button>
          </>
        )}

        {/* Mode: Create / Edit Label */}
        {(mode === 'create' || mode === 'edit') && (
          <>
            {/* Preview */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Preview
              </Typography>
              <Box
                sx={{
                  height: 32,
                  backgroundColor: LABEL_COLORS[selectedColor]?.bg || LABEL_COLORS.blue.bg,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: LABEL_COLORS[selectedColor]?.text || 'white',
                    fontWeight: 500,
                    fontSize: '13px',
                  }}
                >
                  {labelText}
                </Typography>
              </Box>
            </Box>

            {/* Title Input */}
            <TextField
              fullWidth
              size="small"
              label="Title"
              placeholder="Enter label name..."
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
            />

            {/* Color Selection */}
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Select a color
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {Object.keys(LABEL_COLORS).map((color) => (
                <Box
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  sx={{
                    width: 48,
                    height: 32,
                    backgroundColor: LABEL_COLORS[color].bg,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: selectedColor === color ? '2px solid #0079bf' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      backgroundColor: LABEL_COLORS[color].hover,
                    },
                  }}
                >
                  {selectedColor === color && <CheckIcon sx={{ color: LABEL_COLORS[color].text, fontSize: 18 }} />}
                </Box>
              ))}
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={mode === 'create' ? handleCreateLabel : handleUpdateLabel}
                sx={{ textTransform: 'none' }}
              >
                {mode === 'create' ? 'Create' : 'Save'}
              </Button>

              {mode === 'edit' && editingLabel?._id && (
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => {
                    onRemoveLabel(editingLabel._id)
                    setMode('select')
                    setEditingLabel(null)
                  }}
                  sx={{ textTransform: 'none', ml: 'auto' }}
                  startIcon={<DeleteOutlineIcon />}
                >
                  Delete
                </Button>
              )}
            </Box>
          </>
        )}
      </Box>
    </Popover>
  )
}

export default LabelPicker
