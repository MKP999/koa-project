const koaRouter = require('koa-router')
const router = new koaRouter()
const User = require('../../models/User')
const gravatar = require('gravatar')
// 密码加密解密
const bcrypt = require('bcryptjs')
// token
const jwt = require('jsonwebtoken')
// token验证
const passport = require('koa-passport')
// 引入密码加密封装
const tools = require('../../config/tools')
// 验证表单
const validateRegisterInput = require('../../validation/register')
const validateLoginInput = require('../../validation/login')


/**
 * @route GET api/users/test
 * @desc  测试接口地址
 * @access 接口是公开的
 */
router.get('/test', async ctx => {
  ctx.state = 200
  ctx.body = { msg: 'user doing ...'}
})

/**
 * @route POST api/users/register
 * @desc  注册
 * @access 接口是公开的
 */
router.post('/register', async ctx => {
  const {name,email,password} = ctx.request.body
  const {errors, isValid} = validateRegisterInput(ctx.request.body)

  // 判断是否验证通过
  if (!isValid) {
    ctx.state = 400
    ctx.body = errors
    return
  }
  const user = await User.find({email})
  if(user.length > 0) {
    // 找到存在的账号
    ctx.state = 500
    ctx.body = { email: '邮箱已被占用' }
  } else {
    // 未找到
    // 存储
    const avatar = gravatar.url(email, {s: '200', r: 'pg', d: 'mm'});
    const NewUser = new User({
      name,email,password: tools.enbcrypt(password),avatar
    })

    NewUser.save().then(user => {
      ctx.state = 200
      ctx.body = user
      console.log(user)
    }).catch(err => {
      console.log(err)
    })
    // 返回json数据
    ctx.body = NewUser
  }
})

/**
 * @route POST api/users/login
 * @desc  登录
 * @access 接口是公开的
 */
router.post('/login', async ctx => {
  const {email,password} = ctx.request.body
  const {errors, isValid} = validateLoginInput(ctx.request.body)

  // 判断是否验证通过
  if (!isValid) {
    ctx.state = 400
    ctx.body = errors
    return
  }
  const findResult = await User.find({email})
  const user = findResult[0];
  // 搜索不到
  if(user.length === 0) {
    ctx.state = 404
    ctx.body = { msg: '用户名不存在'}
    return
  }
  
  const checkPasswork = await bcrypt.compareSync(password, user.password)
  console.log(checkPasswork)
  if (checkPasswork) {
    // 返回token
    const secret = require('../../config/keys').secretOrKey
    const payload = {id: user.id, name: user.name, avatar: user.avatar}
    const token = jwt.sign(payload, secret, { expiresIn: 3600 })

    ctx.state = 200
    ctx.body = { success: true, token: 'Bearer ' + token }
  } else {

    ctx.state = 400
    ctx.body = { success: false, msg: '密码错误' }
  }

})

/**
 * @route GET api/users/current
 * @desc  获取当前用户信息
 * @access 接口私密的
 */
router.get('/current', passport.authenticate('jwt', { session: false }), async ctx => {
  const {_id,name,email,avatar} = ctx.state.user
  ctx.body = {
    _id,name,email,avatar
  }
})

module.exports = router.routes()
