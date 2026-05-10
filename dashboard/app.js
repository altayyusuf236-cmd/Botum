const config = require("@root/config"),
  utils = require("./utils"),
  CheckAuth = require("./auth/CheckAuth");

module.exports.launch = async (client) => {
  const express = require("express"),
    session = require("express-session"),
    MongoStore = require("connect-mongo"),
    mongoose = require("@src/database/mongoose"),
    path = require("path"),
    app = express();

  const mainRouter = require("./routes/index"),
    discordAPIRouter = require("./routes/discord"),
    logoutRouter = require("./routes/logout"),
    guildManagerRouter = require("./routes/guild-manager");

  client.states = {};
  client.config = config;

  const db = await mongoose.initializeMongoose();

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
        secret: process.env.SESSION_PASSWORD || "varsayilan_sifre_123", // Şifre yoksa çökmesin
        resave: false,
        saveUninitialized: false,
        proxy: true,
        name: "muhtesem_bot_session",
        cookie: { 
          maxAge: 336 * 60 * 60 * 1000,
          secure: true, 
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
      // Kullanıcı verisi çekilirken hata oluşursa dashboard çökmesin
      if (req.user && req.url !== "/") {
          try {
              req.userInfos = await utils.fetchUser(req.user, req.client);
          } catch (err) {
              console.error("User Fetch Error:", err);
              req.userInfos = null;
          }
      }
      next();
    })
    .use("/api", discordAPIRouter)
    .use("/logout", logoutRouter)
    .use("/manage", guildManagerRouter)
    .use("/", mainRouter)
    
    // ⚡ 404 HATASI - Verileri boş obje olarak gönderiyoruz ki EJS patlamasın
    .use(function (req, res) {
      res.status(404).render("404", {
        user: req.userInfos || {},
        client: client,
        currentURL: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      });
    })
    
    // ⚡ 500 HATASI - Gerçek hatayı konsola bas ve sayfayı güvenli gönder
    .use(function (err, req, res, next) {
      console.error("DASHBOARD KRİTİK HATA:", err); // Hatayı Render loglarında görebilmen için
      res.status(500).render("500", {
        user: req.userInfos || {},
        client: client,
        currentURL: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      });
    });

  app.listen(app.get("port"), () => {
    client.logger.success("Dashboard is listening on port " + app.get("port"));
  });
};