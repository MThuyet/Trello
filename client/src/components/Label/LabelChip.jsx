import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { LABEL_COLORS } from '~/utils/constants'

/**
 * Component hiển thị một label chip
 * Responsive: Tăng kích thước trên mobile để dễ chạm
 *
 * @param {object} label - { _id, color, text }
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {boolean} showText - Có hiển thị text hay không
 * @param {function} onClick - Callback khi click vào label
 */
const LabelChip = ({ label, size = 'medium', showText = true, onClick }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const colorConfig = LABEL_COLORS[label.color] || LABEL_COLORS.blue

  // Responsive size styles
  const sizeStyles = {
    small: {
      height: isMobile ? '20px' : '8px',
      minWidth: isMobile ? '44px' : '40px',
      borderRadius: isMobile ? '6px' : '4px',
      px: isMobile ? 0.5 : 0,
    },
    medium: {
      height: isMobile ? '28px' : '16px',
      minWidth: isMobile ? '52px' : '48px',
      borderRadius: isMobile ? '6px' : '4px',
      px: isMobile ? 1.5 : 1,
    },
    large: {
      height: isMobile ? '40px' : '32px',
      minWidth: isMobile ? '64px' : '56px',
      borderRadius: isMobile ? '8px' : '4px',
      px: isMobile ? 2 : 1.5,
    },
  }

  const fontSizes = {
    small: isMobile ? '11px' : '10px',
    medium: isMobile ? '13px' : '12px',
    large: isMobile ? '15px' : '14px',
  }

  const chipContent = (
    <Box
      onClick={onClick}
      sx={{
        ...sizeStyles[size],
        backgroundColor: colorConfig.bg,
        color: colorConfig.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSizes[size],
        fontWeight: 600,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent', // Remove tap highlight on mobile
        '&:hover': {
          backgroundColor: onClick ? colorConfig.hover : colorConfig.bg,
          transform: onClick ? 'scale(1.05)' : 'none',
        },
        '&:active': {
          transform: onClick ? 'scale(0.95)' : 'none',
        },
      }}
    >
      {showText && size !== 'small' && label.text}
    </Box>
  )

  // Không dùng Tooltip trên mobile (cản trở touch)
  if (isMobile) {
    return chipContent
  }

  return (
    <Tooltip title={label.text || label.color} arrow>
      {chipContent}
    </Tooltip>
  )
}

export default LabelChip
