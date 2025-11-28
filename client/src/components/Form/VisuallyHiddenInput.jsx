import { styled } from '@mui/material/styles'

const HiddenInputStyles = styled('input')({
  display: 'none'
})

const VisuallyHiddenInput = (props) => {
  return <HiddenInputStyles {...props} />
}

export default VisuallyHiddenInput
