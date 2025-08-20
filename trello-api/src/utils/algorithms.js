// https://www.mongodb.com/docs/v6.0/reference/method/cursor.skip/
export const pagingSkipValue = (page, itemPerPage) => {
  if (!page || !itemPerPage) return 0
  if (page <= 0 || itemPerPage <= 0) return 0

  // page = 1, itemPerPage = 10 => 1 - 1 = 0 * 10 skip = 0
  // page = 2, itemPerPage = 10 => 2 - 1 = 1 * 10 skip = 10
  return (page - 1) * itemPerPage
}
