

<h1 align="center">基于(RBAC)角色的权限访问控制的后端服务</h1>

<br/>

## 🚀简介

该项目作为 [vue3-luminous-element-plus-adminn](https://github.com/luminous0220/vue3-luminous-element-plus-admin) 的后端服务，值得一提的是，此项目与前端均采用了 `JavaScript` 这一语言极大地降低了开发人员的学习成本,是基于功能强大的 `Nest.Js` 框架进行开发的, `‌Nest.js` 的优势主要体现在其对 `TypeScript` 的完美支持、模块化架构、依赖注入、多种 `Web` 框架支持、强大的中间件支持以及自动化的文档生成

## 🌟技术栈

`Nest.Js` 、 `MySQL` 、 `TypeORM` 、 `PM2` 、 `Redis` 等

1. 引入 `@nestjs/jwt` ，通过 `JWT` 进行权限认证以及 `token` 刷新
2. 引入 `@nestjs/swagge` ，支持 `swagger` 文档在线查看 `API`
3. 引入 `cross-env` ，支持不同模型下环境变量的配置，可在 `.env.development` 文件中配置开发环境，在 `.env.production` 文件中配置生产环境
4. 引入 `excel4node` ，能够创建、解析 `Excle` 文件
5. 引入 `multer`，支持文件上传功能
6. 引入 `nodemailer`，支持邮件发送功能，需要先在 `src\utils\email.ts` 文件中配置发送者的账号、授权密码等
7. 引入 `mysql2`，连接操作 `mysql` 数据库
8. 引入 `hbs`，支持 `HTML` 模板变量


## 🎉功能

1. 验证模块
	* 邮箱验证
2. 权限模块
	* 初始化数据库
	* 用户注册
	* 用户登录
	* 获取个人信息
	* 编辑个人信息
	* 更新个人密码
	* 短信验证码
	* 无感刷新 `Token`
	* 激活账户(通过邮箱验证码激活)
	* 注册失败页面（邮箱激活成功后的提示页面）
	* 注册成功页面（邮箱激活失败后的提示页面）
3. 下载模块
	* 下载批量新增用户的 `Excle` 模版
	* 导出角色列表的 `Excle` 文件
	* 导出用户列表
4. 菜单模块
	* 新增菜单
	* 更新菜单
	* 获取所有菜单
	* 获取个人按钮权限
	* 获取个人菜单权限
	* 删除菜单
5. 角色模块
	* 创建角色
	* 为角色分配菜单
	* 获取用户角色菜单权限
	* 编辑角色
	* 删除角色
	* 获取角色列表
6. 上传模块
	* 批量新增用户（上传 Excle）
	* 图片上传
7. 用户模块
	* 新增用户
	* 删除用户
	* 修改用户状态
	* 获取用户列表
	* 重置密码
	* 编辑用户
	* 授予用户角色


## 🎈预览

后台服务已经部署在云服务器中，大家可以 [点击这里预览前端页面](http://47.109.19.100/#/login) 进行体验

账号：`admin`，密码：`123456`


## 🎨使用

| Node 版本 |
| ------- |
| 20.10.0 |

使用步骤：

```shell
# 拉取后端代码
git clone https://github.com/luminous0220/vue3-luminous-element-plus-admin.git

# 安装后端服务依赖
pnpm install 或 npm install 或 yarn install

# 运行后端项目
pnpm start:dev 或 npm run start:dev 或 pnpm run start:dev
```

> 注意在运行后端项目时需确保本地已安装了 `MySQL、Redis`，并在`.env` 文件中配置连接字段，否则运行会失败

```shell
# 后端项目打包
pnpm build 或 npm run build 或 yarn build
```

