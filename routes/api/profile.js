const koaRouter = require('koa-router')
const router = new koaRouter()
// token验证
const passport = require('koa-passport')
const Profile = require('../../models/Profile')
const validateProfileInput = require('../../validation/profile')

/**
 * @route GET api/profile/test
 * @desc  测试接口地址
 * @access 接口是公开的
 */
router.get('/test', async ctx => {
    ctx.status = 200
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
        ctx.status = 404
        ctx.body = { msg: '该用户没有任何的相关个人信息'}
        return
    }
    ctx.status = 200
    ctx.body = { success: true, data: profile }
})

/**
 * @route POST api/profile
 * @desc  添加或修改用户档案
 * @access 接口是私密的
 */
router.post('/', passport.authenticate('jwt', { session: false }), async ctx => {

  const {errors, isValid} = validateProfileInput(ctx.request.body)

  // 判断是否验证通过
  if (!isValid) {
    ctx.state = 400
    ctx.body = errors
    return
  }

    const body = ctx.request.body

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
    if (body.wechat) {
        profileFields.social.wechat = body.wechat
    }
    if (body.QQ) {
        profileFields.social.QQ = body.QQ
    }
    if (body.tengxunkt) {
        profileFields.social.tengxunkt = body.tengxunkt
    }
    if (body.wangyikt) {
        profileFields.social.wangyikt = body.wangyikt
    }

    const profile = await Profile.find({user: ctx.state.user._id})

    if(profile.length > 0) {
        // 找到 更新
        const profileUpdata = await Profile.findOneAndUpdate(
            {user: ctx.state.user._id}, // 更新哪个
            {$set: profileFields},  // 更新的数据
            {new: true} // 是否替换
        )
        ctx.status = 200
        ctx.body = profileUpdata
    } else {
        // 未找到 添加
        const profileAdd = await new Profile(profileFields).save()
        ctx.status = 200
        ctx.body = profileAdd 
    }
})



  module.exports = router.routes()

