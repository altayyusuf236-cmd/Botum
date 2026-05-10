const config = require("@root/config"),
  utils = require("./utils"),
  CheckAuth = require("./auth/CheckAuth");

module.exports.launch = async (client) => {
  /* Init express app */

  const express = require("express"),
    session = require("express-session"),
    MongoStore = require("connect-mongo"),
    mongoose = require("@src/database/mongoose"),
    path = require("path"),
    app = express();

  /* Routers */
  const mainRouter = require("./routes/index"),
    discordAPIRouter = require("./routes/discord"),
    logoutRouter = require("./routes/logout"),
    guildManagerRouter = require("./routes/guild-manager");

  client.states = {};
  client.config = config;

  const db = await mongoose.initializeMongoose();

  /* App configuration */
  
  // 1. RENDER İÇİN KRİTİK AYARLAR (En üstte olmalı)
  app.set("trust proxy", 1); 

  app
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .engine("html", require("ejs").renderFile)
    .set("view engine", "ejs")
    .use(express.static(path.join(__dirname, "/public")))
    .set("views", path.join(__dirname, "/views"))
    .set("port", process.env.PORT || config.DASHBOARD.port)
    .use(
      session({
        secret: process.env.SESSION_PASSWORD || "gizli_sifre_buraya",
        resave: false, // Genelde false daha stabildir
        saveUninitialized: false,
        proxy: true, // ⚡ RENDER İÇİN ŞART: Proxy'ye güven
        name: "muhtesem_bot_session",
        cookie: { 
          maxAge: 336 * 60 * 60 * 1000,
          secure: true, // ⚡ HTTPS'de çerezlerin gitmesi için ŞART
          httpOnly: true,
          sameSite: 'lax'
        },
        store: MongoStore.create({
          client: db.getClient(),
          dbName: db.name,
          collectionName: "sessions",
          stringify: false,
          autoRemove: "interval",
          autoRemoveInterval: 1,
        }),
      })
    )
    .use(async function (req, res, next) {
      req.user = req.session.user;
      req.client = client;
      if (req.user && req.url !== "/") req.userInfos = await utils.fetchUser(req.user, req.client);
      next();
    })
    .use("/api", discordAPIRouter)
    .use("/logout", logoutRouter)
    .use("/manage", guildManagerRouter)
    .use("/", mainRouter)
    // ⚡ 404 VE 500 SAYFALARINDAN CheckAuth'U KALDIRDIK (Döngüyü kıran yer burası!)
    .use(function (req, res) {
      res.status(404).render("404", {
        user: req.userInfos || null,
        currentURL: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      });
    })
    .use(function (err, req, res, next) {
      console.error(err.stack);
      res.status(500).render("500", {
        user: req.userInfos || null,
        currentURL: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      });
    });

  /* Start */
  app.listen(app.get("port"), () => {
    client.logger.success("Dashboard is listening on port " + app.get("port"));
  });
};