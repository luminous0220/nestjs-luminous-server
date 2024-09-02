import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EmailAuthEntity } from './emailAuth.entity'
import { VerifyService } from './verify.service'
import { JwtModule } from '@nestjs/jwt'
import { VerifyController } from './verify.controller'
import { UserEntity } from '../user/entities/user.entity'
@Module({
  imports: [
    TypeOrmModule.forFeature([EmailAuthEntity, UserEntity]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXPIRESIN }
    })
  ],
  controllers: [VerifyController],
  providers: [VerifyService],
  exports: [VerifyService]
})
export class VerifyModule {}
