const koaRouter = require('koa-router')
const router = new koaRouter()
const User = require('../../models/User')

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
  const user = await User.find({email})
  if(user.length > 0) {
    ctx.state = 500
    ctx.body = { email: '邮箱已被占用' }
  } else {
    const NewUser = new User({
      name,email,password
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


module.exports = router.routes()