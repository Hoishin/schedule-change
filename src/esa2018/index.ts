import {URL} from 'url';
import {scheduleChange} from '../lib';
import {comparator} from './comparator';
import {parser} from './parser';
import {formatter} from './formatter';

export const one = () => {
	scheduleChange(
		'ESA2018-ONE',
		new URL('https://horaro.org/-/api/v1/events/esa/schedules/2018-one'),
		parser,
		comparator,
		formatter
	);
};

export const two = () => {
	scheduleChange(
		'ESA2018-TWO',
		new URL('https://horaro.org/-/api/v1/events/esa/schedules/2018-two'),
		parser,
		comparator,
		formatter
	);
};
