import { useEffect, useMemo } from 'react'
import { debounce } from 'lodash'
/**
 * Custom hook để dùng cho việc debounce function, nhận vào 2 tham số là function cần delay và thời gian delay
 * https://lodash.com/docs/4.17.15#debounce
 */
export const useDebounceFn = (fnToDebounce, delay = 500) => {
  // Trả lỗi luôn nếu delay nhận vào không phải number
  if (isNaN(delay)) {
    throw new Error('Delay value should be a number.')
  }
  // Tương tự cũng trả lỗi luôn nếu fnToDebounce không phải là 1 function
  if (!fnToDebounce || typeof fnToDebounce !== 'function') {
    throw new Error('Debounce must have a function')
  }

  // Tạo phiên bản debounce chỉ khi fnToDebounce hoặc delay thay đổi
  const debouncedFn = useMemo(() => debounce(fnToDebounce, delay), [fnToDebounce, delay])

  // Hủy debounce khi unmount để tránh memory leak
  useEffect(() => () => debouncedFn.cancel(), [debouncedFn])

  return debouncedFn
}
