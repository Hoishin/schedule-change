import config from './template.json';
import horaroData from './horaro.json';

export type Config = typeof config;

export type Horaro = typeof horaroData;

export interface Schedule<I, D> {
	runs: I[];
	data: D;
}