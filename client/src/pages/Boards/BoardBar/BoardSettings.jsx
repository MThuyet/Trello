import { useState } from 'react'
import { Chip, Tooltip } from '@mui/material'
import { CHIP_STYLE } from '~/thems'
import SettingsIcon from '@mui/icons-material/Settings'
import BoardSettingsModal from '~/components/Modal/BoardSettingsModal'

const BoardSettings = () => {
  const [isOpenModal, setIsOpenModal] = useState(false)

  const handleOpenModal = () => {
    setIsOpenModal(true)
  }

  const handleCloseModal = () => {
    setIsOpenModal(false)
  }

  return (
    <>
      <Tooltip title="Board Settings">
        <Chip sx={CHIP_STYLE} icon={<SettingsIcon />} label="Settings" clickable onClick={handleOpenModal} />
      </Tooltip>
      <BoardSettingsModal isOpen={isOpenModal} onClose={handleCloseModal} />
    </>
  )
}

export default BoardSettings
