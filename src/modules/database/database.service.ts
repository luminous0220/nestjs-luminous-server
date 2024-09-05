import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { In, Like, Repository } from 'typeorm'
import { ROLE_ENUME, ROLE_TYPE_ENUM } from 'src/common/constants/role.constant'
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '../role/entities/role.entity';
import { UserEntity } from '../user/entities/user.entity';
import { MenuEntity } from '../menu/entities/menu.entity';
import { encrypByMd5 } from 'src/utils';
import { USER_SEX_ENUM } from 'src/common';


@Injectable()
export class DatbaseService implements OnModuleInit {
  constructor(
    @InjectRepository(MenuEntity)
    private readonly menuEntity: Repository<MenuEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleEntity: Repository<RoleEntity>
  ) { }

  async onModuleInit() {
    await this.createSuperAdminRole();
    await this.createSuperAdminAccount();
    await this.createMenu();
    await this.createNormalUser();
  }

  /**
  * @description 创建超级管理员角色、管理员角色、普通用户角色
  */
  async createSuperAdminRole() {
    const supRole = await this.roleEntity.findOneBy({
      flag: ROLE_ENUME.SUPER
    })
    if (supRole) return

    await this.roleEntity.save([
      {
        id: 1,
        flag: 'super',
        name: '超级管理员',
        desc: '',
        type: ROLE_TYPE_ENUM.BUILT_IN
      },
      {
        id: 2,
        flag: 'admin',
        name: '普通管理员',
        desc: '',
        type: ROLE_TYPE_ENUM.BUILT_IN
      },
      {
        id: 3,
        flag: 'user',
        name: '普通用户',
        desc: '',
        type: ROLE_TYPE_ENUM.BUILT_IN
      }
    ]
    )

    Logger.log('已创建超级管理员角色、普通管理员角色、普通用户角色')
  }

  /**
  * @description 创建超级管理员账户、管理员账户
  */
  async createSuperAdminAccount() {
    const supAccount = await this.userEntity.findOneBy({
      username: ROLE_ENUME.SUPER
    })
    if (supAccount) return

    const sup = await this.roleEntity.findOneBy({
      flag: ROLE_ENUME.SUPER
    })

    const adm = await this.roleEntity.findOneBy({
      flag: ROLE_ENUME.ADMIN
    })


    await this.userEntity.save([
      {
        username: 'super',
        nickname: '超级管理员',
        password: encrypByMd5('default123'),
        status: 1,
        birthday: '1998-08-15',
        sex: USER_SEX_ENUM.MAN,
        email: 'lumin323@qq.com',
        avatar: 'avatar1.jpg',
        sign: '',
        age: 18,
        phone: '19875836765',
        roles: [sup],
        registerIp: '',
        lastLoginIp: '',
        createdAt: '2024-3-13 08:00'
      },
      {
        username: 'admin',
        nickname: '普通管理员',
        password: encrypByMd5('default123'),
        status: 1,
        birthday: '1998-08-15',
        sex: USER_SEX_ENUM.MAN,
        email: 'lumin7@qq.com',
        age: 18,
        phone: '19875836765',
        avatar: 'avatar2.jpg',
        sign: '',
        roles: [adm],
        registerIp: '',
        lastLoginIp: '',
        createdAt: '2024-3-13 08:00'
      },
    ])

    Logger.log('已创建超级管理员账户：用户名为 super，密码为 default123')
    Logger.log('已创建普通管理员账户：用户名为 admin，密码为 default123')
  }

  /**
  * @description 创建菜单
  */
  async createMenu() {

    const home = await this.menuEntity.findOneBy({
      path: '/home'
    })
    if (home) return

    await this.menuEntity.save([
      {
        id: 1,
        title: '首页',
        path: '/home',
        name: 'Home',
        componentPath: '/Home/Home',
        redirect: '',
        parentId: null,
        sort: 0,
        permission: '',
        type: 1,
        icon: 'ep:home-filled',
        status: 1,
        isKeepAlive: 1
      },
      {
        id: 2,
        title: '系统管理',
        path: '/system',
        name: 'System',
        componentPath: '',
        redirect: '',
        parentId: null,
        sort: 0,
        permission: '',
        type: 0,
        icon: 'ep:setting',
        status: 1,
        isKeepAlive: 1
      },
      {
        id: 3,
        title: '用户管理',
        path: '/user',
        name: 'User',
        componentPath: '/System/User/User',
        redirect: '',
        parentId: 2,
        sort: 0,
        permission: '',
        type: 1,
        icon: 'carbon:user-role',
        status: 1,
        isKeepAlive: 1
      },
      {
        id: 4,
        title: '角色管理',
        path: '/role',
        name: 'Role',
        componentPath: '/System/Role/Role',
        redirect: '',
        parentId: 2,
        sort: 0,
        permission: '',
        type: 1,
        icon: 'carbon:user-avatar',
        status: 1,
        isKeepAlive: 1
      },
      {
        id: 5,
        title: '菜单管理',
        path: '/menu',
        name: 'Menu',
        componentPath: '/System/Menu/Menu',
        redirect: '',
        parentId: 2,
        sort: 0,
        permission: '',
        type: 1,
        icon: 'carbon:book',
        status: 1,
        isKeepAlive: 1
      }
    ])

    // 给超级管理员、普通管理员角色授权菜单
    const sup = await this.roleEntity.findOneBy({
      flag: ROLE_ENUME.SUPER
    })
    const adm = await this.roleEntity.findOneBy({
      flag: ROLE_ENUME.ADMIN
    })
    const usr = await this.roleEntity.findOneBy({
      flag: ROLE_ENUME.USER
    })
    const menus = await this.menuEntity.find()
    sup.menus = menus
    adm.menus = menus
    usr.menus = menus
    await this.roleEntity.save([sup, adm, usr])

    Logger.log('已对所有角色授权了所有菜单')
  }

  /**
  * @description 添加普通用户
  */
  async createNormalUser() {
    const userAccount = await this.userEntity.findOneBy({
      username: 'myuser'
    })

    if (userAccount) return

    const user = await this.roleEntity.findOneBy({
      flag: ROLE_ENUME.USER
    })

    await this.userEntity.save([
      {
        username: 'myuser',
        nickname: '普通用户',
        age: 18,
        phone: '19875836765',
        password: encrypByMd5('123456'),
        status: 1,
        birthday: '1998-08-15',
        sex: USER_SEX_ENUM.WOMAN,
        email: 'randomuser3@example.com',
        avatar: 'avatar3.jpg',
        sign: '',
        roles: [user],
        registerIp: '',
        lastLoginIp: '',
        createdAt: '2024-3-13 08:00'
      },
      {
        username: 'hisuser',
        nickname: 'Random User 4',
        password: encrypByMd5('123456'),
        status: 1,
        age: 18,
        phone: '19875836765',
        birthday: '1998-08-15',
        sex: USER_SEX_ENUM.WOMAN,
        email: 'randomuser4@example.com',
        avatar: 'avatar3.jpg',
        sign: '',
        roles: [user],
        registerIp: '',
        lastLoginIp: '',
        createdAt: '2024-3-13 08:00'
      }
    ])
  }
}
