import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { BOARD_TYPES } from '~/utils/constants'
import { columnModel } from './columnModel'
import { cardModel } from './cardModel'
import { pagingSkipValue } from '~/utils/algorithms'

// Define Collection (Name & Schema)

const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  description: Joi.string().required().min(3).max(255).trim().strict(),
  type: Joi.string()
    .valid(...Object.values(BOARD_TYPES))
    .required(),

  // Lưu ý các item trong mảng columnOrderIds là ObjectId nên cần thêm pattern cho chuẩn
  columnOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),

  // những admin của board
  ownerIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),

  // những member của board
  memberIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now()),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

// chỉ định các field không được cập nhật
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

// get list board
const getBoards = async (userId, page, itemPerPage) => {
  try {
    const queryConditions = [
      // điều kiện 1: board chưa bị xóa
      { _destroy: false },
      // điều kiện 2: userId đang thực hiện request phải thuộc 1 trong 2 mảng memberIds hoặc ownerIds
      {
        $or: [
          {
            ownerIds: { $all: [new ObjectId(String(userId))] }
          },
          { memberIds: { $all: [new ObjectId(String(userId))] } }
        ]
      }
    ]

    const query = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate(
        [
          { $match: { $and: queryConditions } },
          // sort title của board theo A-Z (mặc định sẽ bị chữ B hoa đứng trước chữ a thường)
          { $sort: { title: 1 } },
          // $facet xử lý nhiều luồng trong 1 query
          {
            $facet: {
              // luồng thứ nhất: query boards
              queryBoards: [
                {
                  $skip: pagingSkipValue(page, itemPerPage) // bỏ qua số lượng bản ghi của các page trước
                },
                { $limit: itemPerPage } // giới hạn tối đa số lượng bản ghi trên 1 page
              ],
              // luồng thứ hai: query đếm tổng số board trong DB và trả về biến countedAllBoards
              queryTotalBoards: [{ $count: 'countedAllBoards' }]
            }
          }
        ],
        // khai báo thêm thuộc tính collation locale 'en' để fix chữ B hoa đứng trước a thường
        // https://www.mongodb.com/docs/v6.0/reference/collation/#std-label-collation-document-fields
        { collation: { locale: 'en' } }
      )
      .toArray()

    const res = query[0]

    return {
      boards: res.queryBoards || [],
      totalBoards: res.queryTotalBoards[0]?.countedAllBoards || 0
    }
  } catch (error) {
    throw new Error(error)
  }
}

// tạo mới
const createNew = async (userId, data) => {
  try {
    const validData = await validateBeforeCreate(data)

    const newBoardToAdd = {
      ...validData,
      ownerIds: [new ObjectId(String(userId))]
    }

    return await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(newBoardToAdd)
  } catch (error) {
    throw new Error(error)
  }
}

// tìm kiếm theo id
const findOneById = async (id) => {
  try {
    const objectId = new ObjectId(String(id))
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({ _id: objectId })
  } catch (error) {
    throw new Error(error)
  }
}

// query tổng hợp để lấy toàn bộ Columns và Cards thuộc về Board
const getDetails = async (userId, boardId) => {
  try {
    const queryConditions = [
      { _id: new ObjectId(String(boardId)) },
      { _destroy: false },
      {
        $or: [
          {
            ownerIds: { $all: [new ObjectId(String(userId))] }
          },
          { memberIds: { $all: [new ObjectId(String(userId))] } }
        ]
      }
    ]

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        { $match: { $and: queryConditions } },
        // tìm đến Collection Columns ( tương tự JOIN trong SQL )
        {
          $lookup: {
            from: columnModel.COLUMN_COLLECTION_NAME, // xác định collection cần kết nối
            localField: '_id', // trường trong bảng Board dùng để kết nối
            foreignField: 'boardId', // tìm các column thuộc về Board ( tương tự khóa ngoại )
            as: 'columns' // đặt tên cho mảng kết quả
          }
        },
        // Cards
        {
          $lookup: {
            from: cardModel.CARD_COLLECTION_NAME, // xác định collection cần kết nối
            localField: '_id', // trường trong bảng Board dùng để kết nối
            foreignField: 'boardId', // tìm các card thuộc về Board ( tương tự khóa ngoại )
            as: 'cards' // đặt tên cho mảng kết quả
          }
        }
      ])
      .toArray() // chuyển kết quả thành mảng vì arregate luôn trả về một cursor đến một tập kết quả, chứ không trả về một document trực tiếp, dù cursor đó có chứa một phần tử hay nhiều phần tử

    // dữ liệu luôn là mảng có một phần tử vì id là duy nhất
    return result[0] || null // trả về phần tử đầu tiên hoặc mặc định là null
  } catch (error) {
    throw new Error(error)
  }
}

// push columnId vào cuối mảng columnOrderIds
const pushColumnOrderIds = async (column) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        // tìm board theo id
        { _id: new ObjectId(String(column.boardId)) },
        // push columnId vào cuối mảng columnOrderIds
        { $push: { columnOrderIds: new ObjectId(String(column._id)) } },
        // trả về document sau khi cập nhật
        { returnDocument: 'after' }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

// xóa một phần tử columnId ra khỏi mảng columnOrderIds
const pullColumnOrderIds = async (column) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(String(column.boardId))
        },
        { $pull: { columnOrderIds: new ObjectId(String(column._id)) } },
        { returnDocument: 'after' }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

// cập nhật columnOrderIds
const updateColumnOrderIds = async (boardId, updateData) => {
  try {
    // Object.keys() trả về mảng các keys theo thứ tự
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        // xóa các trường không được phép update mà FE cố truyền lên
        delete updateData[fieldName]
      }
    })

    // đối với những trường liên quan tới objectId phải biến đổi
    if (updateData.columnOrderIds) {
      updateData.columnOrderIds = updateData.columnOrderIds.map((id) => new ObjectId(String(id)))
    }

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(String(boardId))
        },
        { $set: updateData }, // cập nhật các trường cần thiết
        { returnDocument: 'after' }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  getBoards,
  createNew,
  findOneById,
  getDetails,
  pushColumnOrderIds,
  updateColumnOrderIds,
  pullColumnOrderIds
}
