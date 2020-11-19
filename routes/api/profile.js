const koaRouter = require('koa-router')
const router = new koaRouter()
// token验证
const passport = require('koa-passport')
const Profile = require('../../models/Profile')

/**
 * @route GET api/profile/test
 * @desc  测试接口地址
 * @access 接口是公开的
 */
router.get('/test', async ctx => {
    ctx.state = 200
    ctx.body = { msg: 'profile doing ...'}
  })

  module.exports = router.routes()

/**
 * @route GET api/profile
 * @desc  获取当前用户档案
 * @access 接口是私密的
 */
router.get('/', passport.authenticate('jwt', { session: false }), async ctx => {
    // 使用 populate 联查user中的两个字段
    const profile = await Profile.find({user: ctx.state.user._id}).populate('user', ['name', 'avatar'])
    console.log(profile)
    if(profile.length < 1) {
        ctx.state = 404
        ctx.body = { msg: '该用户没有任何的相关个人信息'}
        return
    }
    ctx.state = 200
    ctx.body = { success: true, data: profile }
})

/**
 * @route POST api/profile
 * @desc  添加或修改用户档案
 * @access 接口是私密的
 */
router.post('/', passport.authenticate('jwt', { session: false }), async ctx => {
    console.log(ctx.request.body)
    cosnt body = ctx.request.body

    const profileFields = {}
    // 关联user id字段
    profileFields.user = ctx.state.user._id

    if (body.handle) {
        profileFields.handle = body.handle
    }
    if (body.company) {
        profileFields.company = body.company
    }
    if (body.website) {
        profileFields.website = body.website
    }
    if (body.location) {
        profileFields.location = body.location
    }
    if (body.status) {
        profileFields.status = body.status
    }
    if (body.bio) {
        profileFields.bio = body.bio
    }
    if (body.githubusername) {
        profileFields.githubusername = body.githubusername
    }
    // 数组形式
    if (body.skills) {
        profileFields.skills = body.skills.split(',')
    }
    // 社交
    profileFields.social = {}
    if (body.skills) {
        profileFields.skills = body.skills.split(',')
    }
    if (body.skills) {
        profileFields.skills = body.skills.split(',')
    }
    if (body.skills) {
        profileFields.skills = body.skills.split(',')
    }
    if (body.skills) {
        profileFields.skills = body.skills.split(',')
    }

    ctx.state = 200
    ctx.body = { success: true, data: profile }
})



  module.exports = router.routes()

