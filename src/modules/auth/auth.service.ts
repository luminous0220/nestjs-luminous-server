import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { VerifyDto } from '../verify/VerifyDto'
import { VerifyService } from '../verify/verify.service'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import type { Response, Request } from 'express'
import {
  EMAIL_AUTH_ENUM,
  PASSWORD_RESET_ENUM,
  USER_STATUS_ENUM,
  USER_STATUS_ENUM_ERROR_MSG
} from 'src/common'
import { UserService } from '../user/user.service'
import { encrypByMd5, getClientIp } from 'src/utils'
import { UserEntity } from '../user/entities/user.entity'
import { RoleEntity } from '../role/entities/role.entity'
import { LoginDto } from './dto/LoginDto'
import { RegisterDto } from './dto/RegisterDto'
import { ROLE_ENUME } from 'src/common/constants/role.constant'
import { UpdatePasswordDto } from './dto/UpdatePasswordDto'

@Injectable()
export class AuthService {
  constructor(
    private readonly verifyService: VerifyService,
    private readonly userService: UserService,
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleEntity: Repository<RoleEntity>,
  ) { }

  /**
   * @description 校验用户身份
   */
  async verifyUserIdentity(body: LoginDto) {
    const { email, username, password } = body
    if (!username && !email) {
      throw new HttpException('用户名或邮箱至少存在一个', HttpStatus.BAD_REQUEST)
    }
    let u: UserEntity
    if (username) {
      u = await this.userEntity.findOne({
        where: { username }
      })
    } else {
      u = await this.userEntity.findOne({
        where: { email }
      })
    }

    if (!u) {
      throw new HttpException('该用户不存在，请检查用户名或者邮箱是否正确', HttpStatus.BAD_REQUEST)
    }
    // encrypByMd5(decrypt(password)) !== u.password
    if (password != u.password) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST)
    }

    if (u.status !== USER_STATUS_ENUM.ACTIVE) {
      throw new HttpException(USER_STATUS_ENUM_ERROR_MSG[u.status], HttpStatus.BAD_REQUEST)
    }
    return u
  }

  /**
   * @description 校验并创建用户
   */
  async verifyAndCreateUser(body: RegisterDto, req: Request) {
    const { username, email } = body
    if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/.test(username)) {
      throw new HttpException('用户名只能输入数字、26个英文字母(大小写)', HttpStatus.BAD_REQUEST)
    }
    // 验证用户是否已经注册
    const userDoc = await this.userEntity.findOne({
      where: [{ username }, { email }]
    })

    // 用户存在以及其状态不为“pending”时
    if (userDoc && userDoc.status !== USER_STATUS_ENUM.PENDING) {
      if (userDoc.email === email) {
        throw new HttpException('邮箱已被注册', HttpStatus.BAD_REQUEST)
      } else {
        throw new HttpException('用户名已被注册', HttpStatus.BAD_REQUEST)
      }
    }
    const registerIp = getClientIp(req)

    const role = await this.roleEntity.findOneBy({
      flag: ROLE_ENUME.USER
    })

    const userTemp = { ...body, registerIp, role }

    userTemp.password = encrypByMd5(userTemp.password)
    let newUser: UserEntity

    // 如果用户首次注册的话，则先记录存入数据库当中，等待邮箱验证激活
    if (!userDoc) {
      newUser = await this.userEntity.save(userTemp)
    }
    // 如果用户已经注册了一次，但是未激活，此时就无需再存入数据库了，再发送一次验证，将查询的结果返回即可
    else {
      newUser = userDoc
    }

    await this.verifyService.sendEmailAuth(newUser.email, EMAIL_AUTH_ENUM.REGISTRATION)

    return newUser
  }

  /**
   * @description 修改密码
   */
  async updatePassword(params: UpdatePasswordDto) {
    const { codeId, email, type, oldPwd, newPwd, code } = params
    const u = await this.userEntity.findOneBy({ email })

    if (!u) {
      throw new HttpException('该邮箱未注册', HttpStatus.BAD_REQUEST)
    }
    // 通过旧密码修改
    if (type === PASSWORD_RESET_ENUM.PWD) {
      if (encrypByMd5(oldPwd) !== u.password) {
        throw new HttpException('原密码不正确', HttpStatus.BAD_REQUEST)
      }
    }
    // 通过邮箱验证码修改
    else if (type === PASSWORD_RESET_ENUM.EMAIL) {
      const v = await this.verifyService.verifyCode({ codeId, code })

      const { type } = v
      if (type !== EMAIL_AUTH_ENUM.PASSWORD_RESET)
        throw new HttpException('验证码类型错误', HttpStatus.BAD_REQUEST)
    }

    const r = await this.userEntity.update({ id: u.id }, { password: encrypByMd5(newPwd) })
    if (r.affected <= 0) {
      throw new HttpException('更新密码失败，请重试', HttpStatus.BAD_REQUEST)
    }
  }

  /**
   * @description 获取用户信息
   */
  async getUserInfo(userId: number) {
    const u = await this.userEntity.findOne({
      where: { id: userId },
      select: {
        password: false
      }
    })
    return u
  }

  /**
   * @description 激活账户
   */
  async activeAccount(query: VerifyDto, res: Response) {
    try {
      const v = await this.verifyService.verifyCode(query)

      const { type, userId } = v
      if (type !== EMAIL_AUTH_ENUM.REGISTRATION)
        throw new HttpException('验证码类型错误', HttpStatus.BAD_REQUEST)

      const { status } = await this.getUserInfo(userId)
      if (status === USER_STATUS_ENUM.ACTIVE) {
        throw new HttpException(USER_STATUS_ENUM_ERROR_MSG[status], HttpStatus.BAD_REQUEST)
      }

      await this.userService.updateUserStatus(userId, USER_STATUS_ENUM.ACTIVE)

      const { username, email } = await this.getUserInfo(userId)

      res.redirect(`/api/auth/registerSuccess?message=注册成功&username=${username}&email=${email}`)
    } catch (error: any) {
      res.redirect(`/api/auth/registerError?message=${error.message}`)
    }
  }

  /**
   * @description 存储ip
   */
  async savaLoginIp(userId: number, ip: string) {
    return await this.userEntity.update({ id: userId }, { lastLoginIp: ip })
  }

  /**
   * @description 刷新token
   */
  async refreshToken(req: Request) {
    const { userId } = req.user
    const { accessToken, refreshToken, expires } = await this.verifyService.generateToken(userId)
    return {
      accessToken,
      refreshToken,
      expires
    }
  }
}
