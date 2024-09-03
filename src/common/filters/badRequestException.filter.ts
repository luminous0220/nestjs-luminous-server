import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common'
import { Response } from 'express'

/**
* @description 拦截服务发出的异常，并作出响应
*/
@Catch()
export class BadRequestExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    // nestjs内置的异常类
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as any
      const status = exception.getStatus()
      // 如果异常的类型是字符串
      if (typeof exceptionResponse === 'string') {
        return response.status(status).json({
          code: status,
          message: exceptionResponse
        })
      }

      // 如果异常状态码是403
      if (status === 403) {
        return response.status(status).json({
          code: status,
          message: '没有访问权限'
        })
      }

      // 如果异常的消息是数组形式，将 message 数组连接成字符串
      const message = Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message.join(', ')
        : exceptionResponse.message

      return response.status(status).json({
        code: status,
        message
      })
    }
    // 其它异常
    response.status(500).json({
      code: 500,
      message: exception.message
    })
  }
}
