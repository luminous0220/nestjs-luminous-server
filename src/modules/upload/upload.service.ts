import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import ExcleJs from 'exceljs'
import { UserEntity } from '../user/entities/user.entity'
import { Repository } from 'typeorm'
import { encrypByMd5 } from 'src/utils'
import { RoleEntity } from '../role/entities/role.entity'
import { ROLE_ENUME } from 'src/common/constants/role.constant'
import { FILE_PATH } from 'src/common/constants/file.constant'

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userEnity: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleEntity: Repository<RoleEntity>
  ) { }

  /**
  * @description 处理用户列表的Excle
  */
  async handleUsersExcle(file: Express.Multer.File) {
    const workbook = new ExcleJs.Workbook()
    await workbook.xlsx.load(file.buffer)
    const sheet1 = workbook.getWorksheet(1)
    const headers = ['username', 'email', 'nickname', 'password', 'sex', 'birthday', 'sign']
    const userlist = []
    // 读取数据并填充到 userlist 中
    sheet1.eachRow((row, idx) => {
      if (idx > 1) {
        const data = {}
        row.eachCell((cell, col) => {
          // 密码加密MD5
          if (col === 4) {
            data[headers[col - 1]] = encrypByMd5(String(cell.value))
            return
          }

          data[headers[col - 1]] = cell.value
        })
        userlist.push(data)
      }
    })
    const u = await this.roleEntity.findOne({ where: { flag: ROLE_ENUME.USER } })

    // 默认角色为user，状态为1
    userlist.forEach((ite) => {
      ite.roles = [u]
      ite.status = 1
    })
    await this.userEnity.save(userlist)
  }

  /**
* @description 保存图片，返回URL
*/
  async handleImageFile(file: Express.Multer.File) {
    return process.env.IMAGE_URL_PREFIX + '/' + file.filename
  }

  /**
  * @description 修改用户头像
  */
  async editAvatar(id: number, file: Express.Multer.File) {
    const u = await this.userEnity.findOneBy({ id })
    u.avatar = process.env.IMAGE_URL_PREFIX + '/' + file.filename
    await this.userEnity.save(u)
  }
}
