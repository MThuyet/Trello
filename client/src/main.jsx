import ReactDOM from 'react-dom/client'
import App from '~/App.jsx'
// MUI
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles'
import theme from '~/thems.js'
// react-toastify
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
// material-ui-confirm
import { ConfirmProvider } from 'material-ui-confirm'
// redux
import { Provider } from 'react-redux'
import { store } from './redux/store'
// react router dom
import { BrowserRouter } from 'react-router-dom'
// redux persist
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'
// axios injectStore
import { injectStore } from './utils/authorizeAxios'
// socket.io
import { io } from 'socket.io-client'
import { API_ROOT } from '~/utils/constants'
export const socketIoInstance = io(API_ROOT)

// tiêm store vào axios
injectStore(store)

let persistor = persistStore(store)

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      {/*basename: đường dẫn gốc của project, luôn luôn phải đi qua trước khi truy cập vào các route khác */}
      <BrowserRouter basename="/">
        <CssVarsProvider theme={theme}>
          <ConfirmProvider
            defaultOptions={{
              dialogProps: { maxWidth: 'xs' },
              cancellationButtonProps: { color: 'inherit' },
              confirmationButtonProps: { variant: 'outlined' },
              allowClose: false,
            }}>
            <GlobalStyles styles={{ a: { textDecoration: 'none' } }} />
            <CssBaseline />
            <App />
            <ToastContainer position="bottom-left" theme="colored" autoClose={3000} />
          </ConfirmProvider>
        </CssVarsProvider>
      </BrowserRouter>
    </PersistGate>
  </Provider>,
)
