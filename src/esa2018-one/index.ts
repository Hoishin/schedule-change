import {URL} from 'url';
import {scheduleChange} from '../lib';
import {comparer} from './comparer';
import {parser} from './parser';
import {formatter} from './formatter';

const name = 'ESA2018-ONE';
const url = new URL(
	'https://horaro.org/-/api/v1/events/esa/schedules/2018-one'
);

export default () => {
	scheduleChange(name, url, parser, comparer, formatter);
};
