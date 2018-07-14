import * as m from './parser';


describe('parser', () => {
	it('works', async () => {
		const r = m.parser(await import('../types/horaro.json'))
		expect(r.runs).toContainEqual(expect.objectContaining({game: 'Dark Souls III'}))
	})

	it('works with null string', async () => {
		const rawData = await import('../types/horaro.json')
		rawData.data.items[1].data[0] = null
		const r = m.parser(rawData)
		expect(r.runs).toContainEqual(expect.objectContaining({game: 'Dark Souls III'}))
	})
})
