import {URL} from 'url';
import {scheduleChange} from '../lib';
import {comparator} from './comparator';
import {parser} from './parser';
import {formatter} from './formatter';

const name = 'ESA2018-ONE';
const url = new URL(
	'https://horaro.org/-/api/v1/events/esa/schedules/2018-one'
);

export default () => {
	scheduleChange(name, url, parser, comparator, formatter);
};
