import { Snackbar, Alert } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { hideSnackbar, selectSnackbar } from '~/redux/uiSlice/uiSlice'

const GlobalSnackbar = () => {
  const dispatch = useDispatch()
  const { open, message, severity } = useSelector(selectSnackbar)

  const handleClose = (_, reason) => {
    // tránh việc user click chỗ khác thì mất snackbar quá sớm
    if (reason === 'clickaway') return

    // ẩn snackbar
    dispatch(hideSnackbar())
  }

  return (
    <Snackbar open={open} autoHideDuration={2000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <Alert onClose={handleClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}

export default GlobalSnackbar
