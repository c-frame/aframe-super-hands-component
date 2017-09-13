 module.exports = {
   module: {
     loaders: [{
       test: /\.js$/,
       exclude: function (modulePath) {
         return /node_modules/.test(modulePath) &&
            !/reaction_components.node_modules/.test(modulePath);
       },
       loader: 'babel-loader',
       query: {
         presets: ['es2015']
       }
     }]
   }
 };
