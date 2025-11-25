import fs from 'fs'
import path from 'path'

const renderTemplateHtml = (templateName, variables = {}) => {
  try {
    // Đường dẫn đến file template (từ src/utils -> src/templates)
    // process.cwd() là đường dẫn đến thư mục hiện tại của project
    // D:\project\trello-clone\trello-api
    const templatePath = path.resolve(process.cwd(), 'src/templates', `${templateName}.html`)

    // Đọc file template, utf-8 giúp trả về string chứ không phải buffer
    // readFileSync đọc file đồng bộ
    let htmlContent = fs.readFileSync(templatePath, 'utf-8')

    // Thay thế các biến trong template
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g') // tìm tất cả {{ key }} trong htmlContent
      // replace(regex, variables[key]) thay thế tất cả {{ key }} trong htmlContent bằng giá trị từ object variables
      htmlContent = htmlContent.replace(regex, variables[key])
    })

    return htmlContent
  } catch (error) {
    throw new Error(`Error rendering template ${templateName}: ${error.message}`)
  }
}

export { renderTemplateHtml }
