import { useState } from 'react'
import Box from '@mui/material/Box'
import Popover from '@mui/material/Popover'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import CheckIcon from '@mui/icons-material/Check'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { LABEL_COLORS } from '~/utils/constants'

/**
 * Component Popover/Drawer để chọn và quản lý labels
 * - Mobile: Bottom Sheet (Drawer)
 * - Desktop: Popover
 */
const LabelPicker = ({ anchorEl, open, onClose, currentLabels = [], onAddLabel, onUpdateLabel, onRemoveLabel }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [editingLabel, setEditingLabel] = useState(null)
  const [labelText, setLabelText] = useState('')
  const [selectedColor, setSelectedColor] = useState('blue')
  const [mode, setMode] = useState('select') // 'select' | 'create' | 'edit'

  // Reset state khi đóng
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
      onRemoveLabel(existingLabel._id)
    } else {
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

  // Nội dung chính của picker
  const PickerContent = (
    <Box
      sx={{
        width: { xs: '100%', sm: 304 },
        p: { xs: 2.5, sm: 1.5 },
        pb: { xs: 4, sm: 1.5 }, // Thêm padding bottom cho mobile (safe area)
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          px: 0.5,
        }}
      >
        {mode !== 'select' ? (
          <IconButton
            onClick={handleBack}
            sx={{
              minWidth: 44,
              minHeight: 44,
              mr: 1,
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        ) : (
          <Box sx={{ width: 44 }} /> // Placeholder để căn giữa title
        )}
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{
            flex: 1,
            textAlign: 'center',
            fontSize: { xs: '18px', sm: '14px' },
          }}
        >
          {mode === 'select' ? 'Labels' : mode === 'create' ? 'Create label' : 'Edit label'}
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Drag handle indicator for mobile */}
      {isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 32,
            height: 4,
            backgroundColor: 'grey.400',
            borderRadius: 2,
          }}
        />
      )}

      {/* Mode: Select Labels */}
      {mode === 'select' && (
        <>
          {/* Label List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 0.5 }, mb: 2 }}>
            {Object.keys(LABEL_COLORS).map((color) => {
              const colorConfig = LABEL_COLORS[color]
              const existingLabel = currentLabels.find((l) => l.color === color)
              const isSelected = !!existingLabel

              return (
                <Box key={color} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 0.5 } }}>
                  <Box
                    onClick={() => handleColorClick(color)}
                    sx={{
                      flex: 1,
                      height: { xs: 44, sm: 32 }, // Tăng height cho mobile
                      backgroundColor: colorConfig.bg,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: { xs: 2, sm: 1.5 },
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: colorConfig.hover,
                        transform: 'scale(1.01)',
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        color: colorConfig.text,
                        fontWeight: 500,
                        fontSize: { xs: '15px', sm: '13px' },
                      }}
                    >
                      {existingLabel?.text || ''}
                    </Typography>
                    {isSelected && <CheckIcon sx={{ color: colorConfig.text, fontSize: { xs: 22, sm: 18 } }} />}
                  </Box>

                  <IconButton
                    onClick={(e) => handleEditClick(e, existingLabel || { color, text: '' })}
                    sx={{
                      minWidth: 44,
                      minHeight: 44,
                      backgroundColor: { xs: 'action.hover', sm: 'transparent' },
                      '&:hover': { backgroundColor: 'action.selected' },
                    }}
                  >
                    <EditIcon fontSize={isMobile ? 'medium' : 'small'} />
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
              py: { xs: 1.5, sm: 1 },
              fontSize: { xs: '16px', sm: '14px' },
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
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontSize: { xs: '14px', sm: '12px' } }}>
              Preview
            </Typography>
            <Box
              sx={{
                height: { xs: 44, sm: 32 },
                backgroundColor: LABEL_COLORS[selectedColor]?.bg || LABEL_COLORS.blue.bg,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                px: 2,
              }}
            >
              <Typography
                sx={{
                  color: LABEL_COLORS[selectedColor]?.text || 'white',
                  fontWeight: 500,
                  fontSize: { xs: '15px', sm: '13px' },
                }}
              >
                {labelText}
              </Typography>
            </Box>
          </Box>

          {/* Title Input */}
          <TextField
            fullWidth
            size={isMobile ? 'medium' : 'small'}
            label="Title"
            placeholder="Enter label name..."
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            sx={{
              mb: 2.5,
              '& .MuiInputBase-input': {
                fontSize: { xs: '16px', sm: '14px' }, // 16px prevents zoom on iOS
              },
            }}
            autoFocus={!isMobile} // Không autoFocus trên mobile để tránh keyboard jump
          />

          {/* Color Selection */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: 'block', fontSize: { xs: '14px', sm: '12px' } }}
          >
            Select a color
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: { xs: 1.5, sm: 0.5 },
              mb: 3,
            }}
          >
            {Object.keys(LABEL_COLORS).map((color) => (
              <Box
                key={color}
                onClick={() => setSelectedColor(color)}
                sx={{
                  aspectRatio: '1.5',
                  minHeight: { xs: 44, sm: 32 },
                  backgroundColor: LABEL_COLORS[color].bg,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: selectedColor === color ? '3px solid' : '3px solid transparent',
                  borderColor: selectedColor === color ? 'primary.main' : 'transparent',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: LABEL_COLORS[color].hover,
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                }}
              >
                {selectedColor === color && (
                  <CheckIcon sx={{ color: LABEL_COLORS[color].text, fontSize: { xs: 24, sm: 18 } }} />
                )}
              </Box>
            ))}
          </Box>

          {/* Actions */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Button
              variant="contained"
              fullWidth={isMobile}
              onClick={mode === 'create' ? handleCreateLabel : handleUpdateLabel}
              sx={{
                textTransform: 'none',
                py: { xs: 1.5, sm: 1 },
                fontSize: { xs: '16px', sm: '14px' },
              }}
            >
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>

            {mode === 'edit' && editingLabel?._id && (
              <Button
                color="error"
                variant="outlined"
                fullWidth={isMobile}
                onClick={() => {
                  onRemoveLabel(editingLabel._id)
                  setMode('select')
                  setEditingLabel(null)
                }}
                sx={{
                  textTransform: 'none',
                  py: { xs: 1.5, sm: 1 },
                  fontSize: { xs: '16px', sm: '14px' },
                }}
                startIcon={<DeleteOutlineIcon />}
              >
                Delete
              </Button>
            )}
          </Box>
        </>
      )}
    </Box>
  )

  // Mobile: Bottom Sheet (Drawer)
  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '85vh',
            pt: 1.5, // Space for drag handle
          },
        }}
        // Swipe to close
        ModalProps={{
          keepMounted: true,
        }}
      >
        {PickerContent}
      </Drawer>
    )
  }

  // Desktop: Popover
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
      {PickerContent}
    </Popover>
  )
}

export default LabelPicker
