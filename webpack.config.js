 module.exports = {
     module: {
         loaders: [{
             test: /\.js$/,
             exclude: /node_modules/,
             loader: 'babel-loader',
             query: {
              presets: ['es2015']
             }
         }]
     }
 };