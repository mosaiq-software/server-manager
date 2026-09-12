const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = () => {
    return {
        mode: "development",
        entry: path.resolve(__dirname, "src/index.tsx"),
        output: {
            path: path.resolve(__dirname, "public"),
            filename: "bundle.js",
            publicPath: "/",
        },
        devServer: {
            port: "8080",
            historyApiFallback: true,
            static: path.resolve(__dirname, "public"),
            liveReload: true
        },
        devtool: 'source-map',
        resolve: {
            extensions: ['.ts', '.tsx', '.js'],
            modules: ['node_modules'],
            alias: {
                '@': path.resolve(__dirname, 'src/'),
                // Consume the shared common package straight from TS source (no build step),
                // mirroring the tsconfig path aliases.
                '@mosaiq/nsm-common': path.resolve(__dirname, '../common/src'),
            }
        },
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    include: [
                        path.resolve(__dirname, 'src'),
                        path.resolve(__dirname, '../common/src'),
                    ],
                    use: {
                        loader: 'babel-loader',
                        // Presets are set inline (not via .babelrc) so they also apply to the shared
                        // common/ package, whose files live outside this package's babelrc scope.
                        options: {
                            babelrc: false,
                            configFile: false,
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-react',
                                '@babel/preset-typescript',
                            ],
                        },
                    },
                },
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader", "postcss-loader"],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                },
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'src/index.html')
            }),
            new Dotenv(
                process.env.PRODUCTION === "true" ?
                    {
                        systemvars: true,
                    }
                    :
                    {
                        path: '../.env'
                    }
            )
        ],
        optimization: {
            moduleIds: 'deterministic',
        },
    }
}