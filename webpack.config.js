
const htmlPlugin = require("html-webpack-plugin");
const path = require("path");
const uglify = require('uglifyjs-webpack-plugin'); // 压缩 js 文件，webpack 集成的有，不用独立安装 
const clearDir = require("clean-webpack-plugin");// 每次打包前清空目标文件夹
const copyWebpackPlugin= require("copy-webpack-plugin"); // 拷贝静态资源到指定文件夹，相对的是出口文件存放的文件夹
const extractTextPlugin = require("extract-text-webpack-plugin"); // 单独打包 css 文件
const glob = require("glob");  // node 自带模块
const purifyCSSWebpack = require("purifycss-webpack"); // 去除多余的 css 插件
const webpack = require("webpack"); // 引入 webpack ，使用自带插件
var website ={
    publicPath:"http://localhost:5555/"  // 解决打包后图片路径问题路径问题
}
module.exports = {
    entry:{
        bundle:__dirname + "/a.js",
        bb:__dirname + "/s.js",
    },
    //entry:__dirname + "/a.js",
    output:{
        filename:"js/[name].js",
        path:path.resolve( __dirname,"dist"),
        //publicPath:website.publicPath
    },
    module:{
        rules:[
            {
                test:/\.js$/,
                use:{
                    loader:'babel-loader',
                },
                //loader:'babel-loader',
                exclude: /node_modules/  //使用 babel-runtime 时要将node_modules排除，如果不排除，会造成 babel-runtime 的循环引用，产生错误，因为使用 babel-runtime 时，babel 会将里面的代码引用注入编译的模块中
            },
            {
                test:/\.less$/,
                //loader: 'style-loader!css-loader'
                use:extractTextPlugin.extract({
                    use:[
                        {loader:"css-loader"},
                        { 
                            loader:"less-loader"
                        }
                    ],
                    fallback:"style-loader"
                }),
            },{
                test:/\.(gif|jpg|png)$/,
                use:[
                    {
                        loader:"url-loader",
                        options:{
                            limit:5000,
                            //outputPath:"./images/", // 在 dist 目录下存放的目录
                            publicPath:"./", // cdn 路径 这个 cdn 与 出口文件的 cdn 需要同时配置
                            name:"images/[hash].[ext]"
                        }
                    }
                ]
            }
        ]
    },
    externals: {
        // 键对应的是模块的名字，值对应的是打包后，代码中的模块名字，这个需要特别注意，大小写一定要配置正确
    },
    devServer:{
        contentBase:path.resolve( __dirname,"dist"),
        host:"localhost",
        port:5555,
        historyApiFallback:true,
        overlay:true,
        inline:true,
        hot:true,
        proxy:{
            "/api/*":{
                target:"http://localhost:3000",
                changeOrigin: true,
            }
        }
    },

    plugins:[
        new htmlPlugin({
            template:"./index.html",
            minify:{ // 压缩 html 文件
                removeAttributeQuotes:true
            },
            hash:true,  // 加入的 css 和 js 文件添加 hash 值
            // 要往页面中注入的包
            chunks:["react","react-dom","bundle"],
            filename: 'index.html',
        }),
        new htmlPlugin({
            template:"./index.html",
            minify:{ // 压缩 html 文件
                removeAttributeQuotes:true
            },
            hash:true,  // 加入的 css 和 js 文件添加 hash 值
            // 要往页面中注入的包
            chunks:["react","react-dom","bb"],
            filename: 'bb.html',
        }),
        new copyWebpackPlugin([{
            from:path.resolve( __dirname,"react" ),
            to:'./react'
        }]),
        new clearDir(["dist"]), // 清空目标文件夹
        new extractTextPlugin("css/[name].css"), // 单独打包 css 文件  css 前最好不加斜杠
        new purifyCSSWebpack({  // 去除没有用到的css样式
            paths:glob.sync( path.resolve( __dirname,"index.html" ) )
        }),
        new webpack.ProvidePlugin({
            "$":"jquery"
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.optimize.CommonsChunkPlugin({  // 提取公共库的插件 eg：react vue  抽取时会有问题
            //name对应入口文件中的名字，我们起的是jQuery
            name:['react',"react-dom"],
            //把文件打包到哪里，是一个路径
            filename:"reacts/[name].min.js",
            //最小打包的文件模块数，这里直接写2就好
            minChunks:2
        }),
        new uglify(), //生产环境使用，压缩 js 文件
        new webpack.DefinePlugin({  // 配置生产环境还是开发环境
            'process.env': {
                NODE_ENV: '"production"'
            }
        })
    ],
    devtool:"chear-module-eval-source-map" //生产
    //devtool:"source-map" // 开发
}

// 如果 css 文件单独打包到一个单独的文件夹里，背景图片路径就会出问题，这是需要将 output.pubilcPath = http://localhost:port 的绝对路径