const WebpackPwaManifest = require("webpack-pwa-manifest");

const config = {
  entry: {
    index: "./public/index.js"
  },
  output: {
    path: __dirname + "/public/dist",
    filename: "bundle.js"
  },
  mode: "development",
  plugins: [
    new WebpackPwaManifest({
      // the name of the generated manifest file
      filename: "manifest.json",

      // we aren't using webpack to generate our html so we
      // set inject to false
      inject: false,

      // set fingerprints to `false` to make the names of the generated
      // files predictable making it easier to refer to them in our code
      fingerprints: false,

      icons: [
        {
          src: "./public/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "./public/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ],

      name: "BudgetTracker",
      short_name: "BudgetTracker",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      start_url: "/",
      display: "standalone",
    })
  ],
//   module: {
//     rules: [
//       {
//         test: /\.m?js$/,
//         exclude: /(node_modules)/,
//         use: {
//           loader: "babel-loader",
//           options: {
//             presets: ["@babel/preset-env"]
//           }
//         }
//       }
//     ]
//   }
};
module.exports = config;
