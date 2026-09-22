const webpack = require('webpack');
const {globSync} = require("glob");
const path = require("path");
const fs = require("fs");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const fontpath = require('postcss-fontpath');

const IN_DEVSERVER = process.env.WEBPACK_DEV_SERVER || process.env.WEBPACK_SERVE;
const EXPORT_DEMO = process.env.EXPORT_DEMO;

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const FontminPlugin = require('./src/webpack/fontmin-webpack.js');
const TerserWebpackPlugin = require('terser-webpack-plugin');

/*
 * We've enabled HtmlWebpackPlugin for you! This generates a html
 * page for you when you compile webpack, which will make you start
 * developing and prototyping faster.
 *
 * https://github.com/jantimon/html-webpack-plugin
 *
 */

const HTMlEntryList = globSync("./src/*.html").map((ele) => {
	return new HtmlWebpackPlugin({
		filename: path.basename(ele),
		template: ele,
		hash: true
	})
});

const getFontmin = () => {
	let charList = globSync("src/*.{html,shtml}").map((file) => {
		return fs.readFileSync(file)
	})

	return new FontminPlugin({
		autodetect: false, // automatically pull unicode characters from CSS
		glyphs: Buffer.concat(charList).toString('utf-8').split(""),
	})
};

const config = {
	mode: 'development',
	entry: {
		"wistia-s3-player": ['./src/main.js'],
	},

	output: {
		path: path.resolve(__dirname,  (EXPORT_DEMO ? 'docs' : 'dist')),
		filename: IN_DEVSERVER ? 'js/[name].js' : 'js/[name].min.js',
		assetModuleFilename: 'assets/[hash][ext][query]',
		publicPath: "auto",
		library: 'WistiaS3Player', // 库的全局变量名
		libraryTarget: 'umd', // 库的模块定义方式
		globalObject: 'this', // 适用于 Node.js 和浏览器环境
	},

	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
			'vue$': "@vue/runtime-dom",
		},
		extensions: ['.tsx', '.ts', '.js', '.vue'],
	},

	plugins: [
		new webpack.ProgressPlugin(),

		// new MiniCssExtractPlugin({
		// 	// Options similar to the same options in webpackOptions.output
		// 	// all options are optional
		// 	filename: 'css/[name].css',
		// 	// chunkFilename: 'css/[id].css',
		// 	ignoreOrder: false, // Enable to remove warnings about conflicting order
		// }),

		new VueLoaderPlugin(),

		new webpack.DefinePlugin({
			__VUE_OPTIONS_API__: 'true',
			__VUE_PROD_DEVTOOLS__: (IN_DEVSERVER || EXPORT_DEMO) ? 'true' : 'false',
			__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: IN_DEVSERVER ? 'true' : 'false'
		}),

		new CleanWebpackPlugin(),

	].concat(HTMlEntryList).concat(IN_DEVSERVER ? [] : [getFontmin()]),

	module: {
		noParse: /^(vue|vue-router|vuex|vuex-router-sync)$/,
		rules: [
			{
				test: /\.vue$/,
				use: [
					{
						loader: 'vue-loader',
						options: {
							compilerOptions: {
								whitespace: 'condense'
							}
						}
					}
				]
			},
			{
				test: /.(js)$/,
				include: [
					path.resolve(__dirname, 'assets'),
				],
				exclude: /(node_modules|webpack)/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							plugins: [
								[
									"@babel/plugin-transform-template-literals", {
									loose: true
								}],
								"@babel/plugin-transform-runtime",
								"@babel/plugin-syntax-dynamic-import"
							],

							presets: [
								[
									'@babel/preset-env',
									{
										modules: false,
										useBuiltIns: "usage",
										corejs: 3
									}
								]
							]
						}
					},
				],

			},
			{
				test: /\.s[ac]ss$/i,
				use: [
					// {
					// 	loader: MiniCssExtractPlugin.loader,
					// 	options: {
					// 		// you can specify a publicPath here
					// 		// by default it uses publicPath in webpackOptions.output
					// 		publicPath: "../",
					// 	},
					// },
					'style-loader',
					{
						loader: 'css-loader',
						options: {
							sourceMap: true
						}
					},
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: [
									["autoprefixer"],
									fontpath({
										formats: [
											{ type: 'woff2', ext: 'woff2' },
											{ type: 'embedded-opentype', ext: 'eot' },
											{ type: 'woff', ext: 'woff' },
											{ type: 'svg', ext: 'svg'},
										],
									}),
								],
							},
							sourceMap: true,
						}
					},
					{
						loader: 'sass-loader',
						options: {
							additionalData: '@import "common";',
							sourceMap: true,
							sassOptions: {
								includePaths: [
									path.resolve(__dirname, "./src/style/")
								]
							}
						}
					},
				],
			},
			{
				test: /\.(eot|svg|ttf|woff|woff2)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'assets/fonts/[hash][ext][query]'
				},
				parser: {
					dataUrlCondition: {
						maxSize: 4 * 1024 // 4kb
					}
				},
			},
			{
				test: /\.(|png|jpe?g|gif)$/i,
				type: 'asset',
				generator: {
					filename: 'assets/img/[hash][ext][query]'
				},
			},
			{
				test: /\.css$/,
				use: [
					'vue-style-loader',
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: [
									["autoprefixer"],
								],
							},
							sourceMap: true,
						}
					},
				]
			},
		]
	},

	optimization: {

		minimizer: [
			new CssMinimizerPlugin({
				minimizerOptions: {
					preset: [
						'default',
						{
							mergeLonghand: false,
							cssDeclarationSorter: false
						}
					]
				},
			}),
			new TerserWebpackPlugin({
				extractComments: false,
				terserOptions: {
					format: {
						comments: false,
					},
					compress: {
						drop_console: true, // 移除 console.log 语句
					},
				},
			}),
		],

		minimize: process.env.NODE_ENV !== 'development',
	},

	devtool: "source-map",
	// watch: process.env.NODE_ENV === 'development',
	watchOptions: {
		ignored: /(node_modules|webpack)/
	},
	devServer: {
		historyApiFallback: true,
		open: true,
		// static: {
		// 	directory: path.join(__dirname, 'dist'),
		// },
		compress: true,
		allowedHosts: [
			"*",
			"localhost",
			".demo2.mixmedia.com",
		],
	},
	stats: IN_DEVSERVER ? "normal" : "errors-warnings",
};

module.exports = config;
