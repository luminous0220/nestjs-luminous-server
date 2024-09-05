import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm'
import { RoleEntity } from '../role/entities/role.entity';
import { UserEntity } from '../user/entities/user.entity';
import { MenuEntity } from '../menu/entities/menu.entity';
import { DatbaseService } from './database.service'
@Module({
  imports: [
    // 在这里引入 DatabaseController 中要操作的 Entity
    TypeOrmModule.forFeature([MenuEntity, RoleEntity, UserEntity]),
    // 配置数据库连接
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        return {
          type: 'mysql',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USER,
          password: process.env.DB_PASS,
          database: process.env.DB_DATABASE,
          synchronize: Boolean(process.env.DB_SYNC),
          autoLoadEntities: true
        }
      },
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize()
        return dataSource
      }
    }),
  ],
  providers: [DatbaseService],
})
export class DatabaseModule { }
