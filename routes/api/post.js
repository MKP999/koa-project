const koaRouter = require('koa-router')
const router = new koaRouter()
// token验证
const passport = require('koa-passport')
const Post = require('../../models/Post')
const Profile = require('../../models/Profile')
const validatePostInput = require('../../validation/post')
const post = require('../../validation/post')


/**
 * @route GET api/posts/test
 * @desc  测试接口地址
 * @access 接口是公开的
 */
router.get('/test', async ctx => {
  ctx.status = 200
  ctx.body = { msg: 'posts doing ...'}
})

/**
 * @route POST api/posts
 * @desc  创建留言地址
 * @access 接口是私有的
 */
router.post('/', passport.authenticate('jwt', { session: false }), async ctx => {

  const {errors, isValid} = validatePostInput(ctx.request.body)

  // 判断是否验证通过
  if (!isValid) {
    ctx.state = 400
    ctx.body = errors
    return
  }

  const newPost = new Post({
    text: ctx.request.body.text,
      name: ctx.request.body.name,
      avatar: ctx.request.body.avatar,
      user: ctx.state.user.id
  })

  await newPost.save().then(post => {
    console.log('post =>', post)
    ctx.body = post
  }).catch(err => {
    ctx.body = err
  })

  ctx.body = newPost
})


/**
 * @route GET api/posts/all
 * @desc  获取所有留言接口地址
 * @access 接口是公开的
 */
router.get('/all', async ctx => {
  const posts = await Post.find().sort({date: -1})

  ctx.status = 200
  ctx.body = posts
})

/**
 * @route GET api/posts?id=123
 * @desc  获取单个留言接口地址
 * @access 接口是公开的
 */
router.get('/', async ctx => {
  const id = ctx.request.query.id

  await Post.findById(id)
  .then(post => {
    ctx.status = 200
    ctx.body = post
  })
  .catch(err => {
    ctx.status = 404
    ctx.body = err
  })
})


/**
 * @route DELETE api/posts?id=123
 * @desc  删除单个留言接口地址
 * @access 接口是私有的
 */
router.delete('/', passport.authenticate('jwt', { session: false }), async ctx => {
  const id = ctx.request.query.id

  const profile = await Profile.find({user: ctx.state.user._id})
  // 判断是否有留言信息 
  if(profile.length < 1) {
    ctx.status = 404
    ctx.body = { msg: '没有任何信息' }
    return
  }
  
  // 查找此条留言
  const post = await Post.findById(id)
  if (post.user.toString() !== ctx.state.user._id.toString()) {
    ctx.status = 401
    ctx.body = { msg: '非法操作' }
    return
  }

  await Post.findByIdAndDelete(id)
  ctx.status = 200
  ctx.body = {success: true}
  // await Post.remove({ _id: id }).then(() => {
  //   ctx.status = 200;
  //   ctx.body = { success: true };
  // });
})


/**
 * @route POST api/posts/like?id=123
 * @desc  点赞/取消点赞接口地址接口地址
 * @access 接口是私有的
 */
router.post('/like', passport.authenticate('jwt', { session: false }), async ctx => {
  const id = ctx.query.id
  // 查询该留言
  const profile = await Profile.find({user: ctx.state.user._id})
  if(profile.length > 0) {
    // 找到
    const post = await Post.findById(id)
    // 是否有点赞
    const isLike = post.likes.filter(item => item.user.toString() === ctx.state.user._id.toString()).length === 0
    if(isLike) {
      // 没有点赞
      const newLike = {
        user: ctx.state.user._id
      }
      // 放入likes数组中  
      post.likes.unshift(newLike)
      // 更新数据库存储
      const postUpdate = await Post.findOneAndUpdate(
        {_id: id},
        {$set: post},
        {new: true}
      )
      ctx.status = 200
      ctx.body = {msg: '点赞成功', data: postUpdate}
      
    } else {
      // 有点赞
      const removeIndex = post.likes.map(item => item.user).indexOf(ctx.state.user._id)

      // 删除该点赞数据
      post.likes.splice(removeIndex, 1)
      // 更新存储
      const postUpdate = await Post.findOneAndUpdate(
        {_id: id},
        {$set: post},
        {new: true}
      )

      ctx.status = 200
      ctx.body = {msg: '取消点赞', data: postUpdate}

    }
  } else {
    // 未找到
    ctx.status = 404
    ctx.body = { msg: '未找到该个人信息' }
  } 

})


/**
 * @route POST api/posts/comment?id=123
 * @desc  创建评论接口地址接口地址
 * @access 接口是私有的
 */
router.post('/comment', passport.authenticate('jwt', { session: false }), async ctx => {
  const id = ctx.query.id

  const profile = await Profile.find({user: ctx.state.user.id})
  if (profile.length > 0) {
    // 查找留言
    const post = await Post.findById(id)
    // 评论内容
    const newComment = {
      text: ctx.request.body.text,
      name: ctx.request.body.name,
      avatar: ctx.request.body.avatar,
      user: ctx.state.user.id,
    }
    post.comments.unshift(newComment)
    // 更新评论 存储
    const postUpdate = await Post.findOneAndUpdate(
      {_id: id},
      {$set: post},
      {new: true}
    )

    ctx.state = 200
    ctx.body = postUpdate
  } else {
    // 未找到
    ctx.status = 404
    ctx.body = { msg: '未找到该个人信息' }
  }
})


/**
 * @route DELETE api/posts/comment?post_id=123&com_id=123
 * @desc  删除评论接口地址接口地址
 * @access 接口是私有的
 */
router.delete('/comment', passport.authenticate('jwt', { session: false }), async ctx => {
  const post_id = ctx.query.post_id
  const com_id = ctx.query.com_id

  const profile = await Profile.find({user: ctx.state.user.id})
  if (profile.length > 0) {
    // 有留言信息
    // 获取该留言信息
    const post = await Post.findById(post_id)
    if (post.comments.length > 0) {
      // 该留言信息具有评论信息
      // 判断是否本人操作 否则非法操作
      // post.comments.forEach(comment => {
      //   if (comment._id.toString() === com._id.toString()) {
      //     if (comment.user.toString() !== ctx.state.user.id) {
      //       ctx.status = 401
      //       ctx.body = { msg: '非法操作'}
      //     }
      //   }
      // })

      // 查找需要删除评论的下标
      const removeIndex = post.comments.map(item => item._id.toString()).indexOf(com_id)
      
      // 删除该评论
      post.comments.splice(removeIndex, 1)
      // 更新数据 存储
      const postUpdate = await Post.findOneAndUpdate(
        {_id: post_id},
        {$set: post},
        {new: true}
      )
      ctx.status = 200
      ctx.body = postUpdate

    } else {
      ctx.status = 404
      ctx.body = { msg: '没有评论信息' }
    }
  } else {
    // 未找到
    ctx.status = 404
    ctx.body = { msg: '未找到该个人信息' }
  }
})

module.exports = router.routes()