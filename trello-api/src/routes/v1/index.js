import express from 'express'
import { boardRoute } from './boardRoute'
import { columnRoute } from './columnRoute'
import { cardRoute } from './cardRoute'
import { userRoute } from './userRoute'
const Router = express.Router()

// Ping API (không cần xác thực, dùng để giữ cho Render luôn hoạt động)
Router.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  })
})

// Board API
Router.use('/boards', boardRoute)

// Column API
Router.use('/columns', columnRoute)

// Card API
Router.use('/cards', cardRoute)

// User API
Router.use('/users', userRoute)

export const APIs_V1 = Router
