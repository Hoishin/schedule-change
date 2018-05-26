'use strict';

const axios = require('axios');

const fetchSchedule = async () => {
	const {data} = await axios.get(process.env.TRACKER_ENDPOINT);
	return data;
};

module.exports.main = () => {
	fetchSchedule()
		.then(console.log)
		.catch(console.error);
};
