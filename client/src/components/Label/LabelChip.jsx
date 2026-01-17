import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import { LABEL_COLORS } from '~/utils/constants'

/**
 * Component hiển thị một label chip
 * @param {object} label - { _id, color, text }
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {boolean} showText - Có hiển thị text hay không
 * @param {function} onClick - Callback khi click vào label
 */
const LabelChip = ({ label, size = 'medium', showText = true, onClick }) => {
  const colorConfig = LABEL_COLORS[label.color] || LABEL_COLORS.blue

  const sizeStyles = {
    small: {
      height: '8px',
      minWidth: '40px',
      borderRadius: '4px',
      px: 0,
    },
    medium: {
      height: '16px',
      minWidth: '48px',
      borderRadius: '4px',
      px: 1,
    },
    large: {
      height: '32px',
      minWidth: '56px',
      borderRadius: '4px',
      px: 1.5,
    },
  }

  return (
    <Tooltip title={label.text || label.color} arrow>
      <Box
        onClick={onClick}
        sx={{
          ...sizeStyles[size],
          backgroundColor: colorConfig.bg,
          color: colorConfig.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size === 'small' ? '10px' : '12px',
          fontWeight: 600,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: onClick ? colorConfig.hover : colorConfig.bg,
            transform: onClick ? 'scale(1.05)' : 'none',
          },
        }}
      >
        {showText && size !== 'small' && label.text}
      </Box>
    </Tooltip>
  )
}

export default LabelChip
