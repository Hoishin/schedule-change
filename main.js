require('dotenv').config();
const modules = require('./build');

exports.sgdq2018 = () => {
	modules.sgdq2018.run();
};
