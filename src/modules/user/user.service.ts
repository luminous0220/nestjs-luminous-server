import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, In, Like, Repository } from 'typeorm'
import { USER_STATUS_ENUM } from 'src/common'
import { encrypByMd5 } from 'src/utils'
import { UserEntity } from './entities/user.entity'
import { UpdateUserDto } from './dto/UpdateUserDto'
import { AssignRoleDto } from './dto/AssignRoleDto'
import { RoleEntity } from '../role/entities/role.entity'
import { FindAllUserDto } from './dto/FindAllUserDto'
import { VerifyService } from '../verify/verify.service'
import type { Request } from 'express'
import { CreateUserDto } from './dto/CreateUserDto'
import { UpdateUserStatusDto } from './dto/UpdateUserStatusDto'
import { ROLE_ENUME } from 'src/common/constants/role.constant'
import { DeleteUserDto } from './dto/DeleteUserDto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleEntity: Repository<RoleEntity>,
    private readonly verifyService: VerifyService
  ) { }

  /**
   * @description 新增用户
   */
  async create(body: CreateUserDto) {
    body.password = encrypByMd5(body.password)
    const role = await this.roleEntity.findOne({
      where: { flag: ROLE_ENUME.USER }
    })

    await this.userEntity.save({ ...body, roles: [role], status: USER_STATUS_ENUM.ACTIVE })
  }

  /**
   * @description 删除用户
   */
  async delete(body: DeleteUserDto) {
    await this.userEntity.softDelete(body.ids)
  }

  /**
   * @description 修改用户状态
   */
  async updateStatus(query: UpdateUserStatusDto) {
    const { id, status } = query
    return await this.userEntity.update({ id }, { status })
  }

  /**
   * @description 更新用户信息
   */
  async updateUser(id: number, body: UpdateUserDto) {
    const u = await this.userEntity.findOneBy({ id })
    if (!u) {
      throw new HttpException('当前用户不存在', HttpStatus.BAD_REQUEST)
    }
    await this.userEntity.update({ id }, body)
  }

  /**
   * @description 更新用户信息
   */
  async resetPassword(id: number) {
    const u = await this.userEntity.findOneBy({ id })
    if (!u) {
      throw new HttpException('当前用户不存在', HttpStatus.BAD_REQUEST)
    }
    u.password = encrypByMd5('123456')
    await this.userEntity.save(u)
  }

  /**
   * @description 更新用户状态
   */
  async updateUserStatus(userId: number, status: USER_STATUS_ENUM) {
    const u = await this.userEntity.update({ id: userId }, { status })
    return u.affected > 0
  }

  /**
   * @description 授予用户角色
   */
  async assign(req: Request, id: number, body: AssignRoleDto) {

    const user = await this.userEntity.findOne({
      where: { id: req.user.userId },
      relations: {
        roles: true
      }
    })
    const { roleIds } = body

    const targetUser = await this.userEntity.findOneBy({ id })

    let ids = await this.roleEntity.findBy({ id: In(roleIds) })

    // 如果是超级管理员账号，可任意修改角色
    if (user.username === ROLE_ENUME.SUPER) {
      targetUser.roles = ids
      return await this.userEntity.save(targetUser)

    }

    // 判断修改对象是否是超级管理员，如果是则不允许修改
    if (targetUser.username === ROLE_ENUME.SUPER) {
      throw new HttpException('无权修改超级管理员的角色', HttpStatus.BAD_REQUEST)
    }

    targetUser.roles = ids
    await this.userEntity.save(targetUser)

  }

  /**
   * @description 获取用户列表
   */
  async findAll(query: FindAllUserDto) {
    const { username, email, startTime, endTime } = query
    let { pageNumber, pageSize } = query
    pageNumber = pageNumber ? pageNumber : 1
    pageSize = pageSize ? pageSize : 10
    const [data, total] = await this.userEntity.findAndCount({
      where: {
        createdAt: Between(startTime, endTime),
        username: Like(`%${username || ''}%`),
        email: Like(`%${email || ''}%`)
      },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      order: {
        createdAt: 'DESC'
      },
      relations: {
        roles: true
      },
      select: {
        id: true,
        email: true,
        status: true,
        username: true,
        nickname: true,
        sex: true,
        birthday: true,
        avatar: true,
        sign: true,
        createdAt: true,
        updatedAt: true
      }
    })
    return {
      list: data,
      total
    }
  }
}
