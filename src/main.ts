import Dotenv from 'dotenv'
if (process.env.NODE_ENV === 'development') {
  Dotenv.config({ path: '.env.development' }); // 加载开发环境 env 文件
} else if (process.env.NODE_ENV === 'production') {
  Dotenv.config({ path: '.env.production' }); // 加载生产环境 env 文件
}
import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'node:path'
import { createSwagger } from './common/swagger'
import { AppModule } from './app.module'
import { BadRequestExceptionFilter, TransformInterceptor } from 'src/common'
import hbs from 'hbs'
import getIp from 'get-ip'
import compression from 'compression'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  // 压缩报文
  app.use(compression())
  // 支持跨域
  app.enableCors()
  // 设置全局路由前缀
  app.setGlobalPrefix(process.env.APIPREFIX)
  // 使用全局拦截器
  app.useGlobalInterceptors(new TransformInterceptor())
  // 使用过滤器
  app.useGlobalFilters(new BadRequestExceptionFilter())
  // 配置静态资产的服务
  app.useStaticAssets(join(__dirname, '../', 'public'))
  // 用于设置视图模板的基础目录
  app.setBaseViewsDir(join(__dirname, '../', 'views'))
  // 设置应用使用的视图引擎
  app.setViewEngine('html')
  // 通常是与 setViewEngine 一起使用，用于指定具体的视图引擎类型，比如 ejs 、pug 等
  app.engine('html', hbs.__express)
  // 设置全局的管道
  app.useGlobalPipes(
    // 用于输入数据的验证和处理
    new ValidationPipe({
      // 去除未在 DTO（数据传输对象）中明确定义的属性
      whitelist: true,
      // 开启数据类型转换
      transform: true,
      // 配置数据类型转换的选项
      transformOptions: {
        // 开启class-transformer的隐式类型强制转换
        enableImplicitConversion: true
      }
    })
  )
  // 创建swagger文档
  createSwagger(app)
  await app.listen(process.env.PORT, () => {
    const ips = getIp()
    Logger.log(
      `服务已经启动,接口请访问: http://${ips[0]}:${process.env.PORT}${process.env.APIPREFIX}`
    )
    Logger.log(
      `swagger文档已经就绪,文档地址请访问: http://${ips[0]}:${process.env.PORT}${process.env.SWAGGERPREFIX}`
    )
    Logger.log(
      `当前模式处于：${process.env.NODE_ENV}`
    )
  })
}
bootstrap()
