const koa = require('koa')
const koaRouter = require('koa-router')
const mongoose = require('mongoose')
const colors = require('colors')
const bodyParser = require('koa-bodyparser')
const passport = require('koa-passport')

const app = new koa()

const db = require('./config/keys').mongoURL

// 使用
app.use(bodyParser())

// 引入路由文件
const user = require('./routes/api/user')
const profile = require('./routes/api/profile')

// 连接数据库
mongoose.connect(db,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    }).then(() => {
  console.log('mongoose connected ...'.red.bold)
}).catch(err => {
  console.log(err)
})

// passport初始化
app.use(passport.initialize())
app.use(passport.session())

// 回调到config文件中 passport.js
require('./config/passport')(passport);

//创建路由
const router = new koaRouter()

// 配置user路由 挂载路由节点
router.use('/api/users', user)
router.use('/api/profile', profile)


// 配置路由
app.use(router.routes()).use(router.allowedMethods())

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server on ${PORT}`))