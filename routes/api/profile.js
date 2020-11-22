const koaRouter = require('koa-router')
const router = new koaRouter()
// token验证
const passport = require('koa-passport')
const Profile = require('../../models/Profile')
const validateProfileInput = require('../../validation/profile')
const validateExperienceInput = require('../../validation/experience')
const validateEducationInput = require('../../validation/education')

const User = require('../../models/User')

/**
 * @route GET api/profile/test
 * @desc  测试接口地址
 * @access 接口是公开的
 */
router.get('/test', async ctx => {
    ctx.status = 200
    ctx.body = { msg: 'profile doing ...'}
  })


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


/**
 * @route GET api/profile/handle?handle=test
 * @desc  获取所有人信息接口地址
 * @access 接口是公开的
 */
router.get('/handle', async ctx => {
    const errors = {}
    const handle = ctx.query.handle
    const profile = await Profile.find({handle}).populate('user', ['name', 'avatar'])

    if (profile.length < 1) {
        errors.noprofile = '未找到该用户信息';
        ctx.status = 404;
        ctx.body = errors;
    } else {
        ctx.body = profile[0];
    }
})

/**
 * @route GET api/profile/all
 * @desc  获取所有人信息接口地址
 * @access 接口是公开的
 */
router.get('/all', async ctx => {
    const errors = {};
    const profiles = await Profile.find({}).populate('user', ['name', 'avatar']);
  
    if (profiles.length < 1) {
      errors.noprofile = '没有任何用户信息';
      ctx.status = 404;
      ctx.body = errors;
    } else {
      ctx.body = profiles;
    }
  });


/**
 * @route POST api/profile/experience
 * @desc  添加个人经验
 * @access 接口是私有的
 */
router.post('/experience', passport.authenticate('jwt', { session: false }), async ctx => {
    
  const {errors, isValid} = validateExperienceInput(ctx.request.body)

  // 判断是否验证通过
  if (!isValid) {
    ctx.state = 400
    ctx.body = errors
    return
  }

    // 判断该用户是否有个人档案
    console.log(111, ctx.state)
    const profile = await Profile.find({user: ctx.state.user._id})

    if (profile.length < 1) {
        ctx.status = 404
        ctx.body = {msg: '没有该用户的信息'}
        return
    }

    const profileFields = {}
    profileFields.experience = []

    const nexExp = {
        title: ctx.request.body.title,
        current: ctx.request.body.current,
        company: ctx.request.body.company,
        location: ctx.request.body.location,
        from: ctx.request.body.from,
        to: ctx.request.body.to,
        description: ctx.request.body.description
    }

    profileFields.experience.unshift(nexExp)

    // 存储
    const profileUpdata = await Profile.update(
        {user: ctx.state.user._id},
        {$push: {experience: profileFields.experience}},
        {$sort: 1}
    )

    if (profileUpdata.ok == 1) {
        const profile = await Profile.find({user: ctx.state.user._id}).populate('user', ['name', 'avatar'])
        if (profile) {
            ctx.body = profile
            ctx.status = 200
        }
    }
})

/**
 * @route GET api/profile/education
 * @desc  教育接口地址
 * @access 接口是私有的
 */
router.post(
    '/education',
    passport.authenticate('jwt', { session: false }),
    async ctx => {
      const { errors, isValid } = validateEducationInput(ctx.request.body);
  
      // 判断是否验证通过
      if (!isValid) {
        ctx.status = 400;
        ctx.body = errors;
        return;
      }
      const profileFields = {};
      profileFields.education = [];
  
      const profile = await Profile.find({ user: ctx.state.user.id });
  
      if (profile.length > 0) {
        const newEdu = {
          school: ctx.request.body.school,
          current: ctx.request.body.current,
          degree: ctx.request.body.degree,
          fieldofstudy: ctx.request.body.fieldofstudy,
          from: ctx.request.body.from,
          to: ctx.request.body.to,
          description: ctx.request.body.description
        };
  
        profileFields.education.unshift(newEdu);
        const profileUpdate = await Profile.update(
          { user: ctx.state.user.id },
          { $push: { education: profileFields.education } },
          { $sort: 1 }
        );
  
        // ctx.body = profileUpdate;
        if (profileUpdate.ok == 1) {
          const profile = await Profile.find({
            user: ctx.state.user.id
          }).populate('user', ['name', 'avatar']);
  
          if (profile) {
            ctx.status = 200;
            ctx.body = profile;
          }
        }
      } else {
        errors.noprofile = '没有该用户的信息';
        ctx.status = 404;
        ctx.body = errors;
      }
    }
)  

/**
 * @route DELETE api/profile/experience?id=123
 * @desc  删除工作经历接口地址
 * @access 接口是私有的
 */
router.delete('/experience', passport.authenticate('jwt', { session: false }), async ctx => {
  // 需要删除的 工作经历id
  const id = ctx.request.query.id
  // 查找到该用户的个人档案
  const profile = await Profile.find({user: ctx.state.user._id})
  // 判断该个人档案中是否有工作经历
  if(profile[0].experience.length > 0) {
    // 获取下标
   const removeIndex = profile[0].experience.map(item => item._id).indexOf(id)

     // 删除该工作经验
    profile[0].experience.splice(removeIndex, 1)
    // 更新存储
    const profileUpdate = await Profile.findOneAndUpdate(
      {user: ctx.state.user._id},
      {$set: profile[0]},
      {new: true}
    )

    ctx.status = 200
    ctx.body = profileUpdate

  } else {
    ctx.status = 404
    ctx.body = { msg: '没有任何数据'}
  }
})

/**
 * @route DELETE api/profile/education?id=123
 * @desc  删除教育经历接口地址
 * @access 接口是私有的
 */
router.delete('/education', passport.authenticate('jwt', { session: false }), async ctx => {
  // 需要删除的 工作经历id
  const id = ctx.request.query.id
  // 查找到该用户的个人档案
  const profile = await Profile.find({user: ctx.state.user._id})
  // 判断该个人档案中是否有工作经历
  if(profile[0].education.length > 0) {
    // 获取下标
   const removeIndex = profile[0].education.map(item => item._id).indexOf(id)

     // 删除该工作经验
    profile[0].education.splice(removeIndex, 1)
    // 更新存储
    const profileUpdate = await Profile.findOneAndUpdate(
      {user: ctx.state.user._id},
      {$set: profile[0]},
      {new: true}
    )

    ctx.status = 200
    ctx.body = profileUpdate

  } else {
    ctx.status = 404
    ctx.body = { msg: '没有任何数据'}
  }
})


/**
 * @route DELETE api/profile
 * @desc  删除整个用户接口地址
 * @access 接口是私有的
 */
router.delete('/', passport.authenticate('jwt', { session: false }), async ctx => {
  const profile = await Profile.deleteOne({user: ctx.state.user._id})
  if(profile.ok === 1) {
    // 删除成功
    const user = await User.deleteOne({_id: ctx.state.user._id})
    if (user.ok === 1) {
      ctx.status = 200;
      ctx.body = { success: true };
    }
  } else {
    ctx.status = 404
    ctx.body = { msg: '未找到该数据' }
  }
})

  module.exports = router.routes()

